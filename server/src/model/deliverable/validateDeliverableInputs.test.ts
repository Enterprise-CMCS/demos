// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { ApplicationStatus, PersonType } from "../../types";
import { ParsedCreateDeliverableInput } from ".";
import {
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLError } from "graphql";

// Functions under test
import { validateCreateDeliverableInput } from "./validateDeliverableInputs";

// Mock imports
vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../user", () => ({
  getUser: vi.fn(),
}));

vi.mock("../demonstrationTypeTagAssignment", () => ({
  getDemonstrationTypeAssignments: vi.fn(),
}));

vi.mock(".", () => ({
  checkDemonstrationStatus: vi.fn(),
  checkOwnerPersonType: vi.fn(),
  checkRequestedDeliverableDemonstrationType: vi.fn(),
}));

import { getApplication } from "../application";
import { getUser } from "../user";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import {
  checkDemonstrationStatus,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
} from ".";

describe("validateDeliverableInputs", () => {
  const mockDemonstration: Partial<PrismaDemonstration> = {
    id: "791b5e55-680d-47f3-bfba-9f242b69b8b2",
    statusId: "Approved" satisfies ApplicationStatus,
  };
  const mockUser: Partial<PrismaUser> = {
    id: "e132432c-e26a-4f1e-958b-7c5b68019272",
    personTypeId: "demos-cms-user" satisfies PersonType,
  };
  const mockDemonstrationTypeTagAssignments: Partial<PrismaDemonstrationTypeTagAssignment>[] = [
    {
      demonstrationId: mockDemonstration.id,
      tagNameId: "Free Insulin",
    },
    {
      demonstrationId: mockDemonstration.id,
      tagNameId: "Subsidy Program for At Home Diagnostics",
    },
  ];
  const testInput: ParsedCreateDeliverableInput = {
    name: "A test deliverable",
    deliverableType: "Evaluation Design",
    demonstrationId: mockDemonstration.id!,
    cmsOwnerUserId: mockUser.id!,
    dueDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2023, 10, 12, 23, 59, 59, 999, "America/New_York"),
    },
    demonstrationTypes: ["Free Insulin", "Subsidy Program for At Home Diagnostics"],
  };
  const mockTransaction: any = "Test!";

  describe("validateCreateDeliverableInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(getApplication).mockResolvedValue(mockDemonstration as PrismaDemonstration);
      vi.mocked(getUser).mockResolvedValue(mockUser as PrismaUser);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockDemonstrationTypeTagAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
    });

    it("should not throw if none of the rules are violated", async () => {
      vi.mocked(checkDemonstrationStatus).mockReturnValue(undefined);
      vi.mocked(checkOwnerPersonType).mockReturnValue(undefined);
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValue(undefined);

      await expect(
        validateCreateDeliverableInput(testInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should get the demonstration, user, and demonstration type info", async () => {
      await validateCreateDeliverableInput(testInput, mockTransaction);

      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testInput.demonstrationId, {
        applicationTypeId: "Demonstration",
        tx: mockTransaction,
      });
      expect(getUser).toHaveBeenCalledExactlyOnceWith(
        { id: testInput.cmsOwnerUserId },
        mockTransaction
      );
      expect(getDemonstrationTypeAssignments).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: testInput.demonstrationId },
        mockTransaction
      );
    });

    it("should call the checking functions with the results of the queries", async () => {
      await validateCreateDeliverableInput(testInput, mockTransaction);

      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(mockDemonstration);
      expect(checkOwnerPersonType).toHaveBeenCalledExactlyOnceWith(mockUser);
      expect(vi.mocked(checkRequestedDeliverableDemonstrationType).mock.calls).toStrictEqual([
        [testInput.demonstrationTypes![0], mockDemonstrationTypeTagAssignments, mockDemonstration],
        [testInput.demonstrationTypes![1], mockDemonstrationTypeTagAssignments, mockDemonstration],
      ]);
    });

    it("should throw if the demonstration status check fails", async () => {
      vi.mocked(checkDemonstrationStatus).mockReturnValue("The demo status check failed");

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createDeliverable have failed."
        );
        expect(error.extensions.code).toBe("CREATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual(["The demo status check failed"]);
      }
    });

    it("should throw if the owner person type check fails", async () => {
      vi.mocked(checkOwnerPersonType).mockReturnValue("The owner person type check failed");

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createDeliverable have failed."
        );
        expect(error.extensions.code).toBe("CREATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The owner person type check failed",
        ]);
      }
    });

    it("should throw if the demonstration type check fails", async () => {
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValue(
        "The demonstration type check failed"
      );

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createDeliverable have failed."
        );
        expect(error.extensions.code).toBe("CREATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The demonstration type check failed",
          "The demonstration type check failed",
        ]);
      }
    });

    it("should only throw for the demonstration type checks that fail", async () => {
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValueOnce(
        "The demonstration type check failed"
      );

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createDeliverable have failed."
        );
        expect(error.extensions.code).toBe("CREATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The demonstration type check failed",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDemonstrationStatus).mockReturnValue("The demo status check failed");
      vi.mocked(checkOwnerPersonType).mockReturnValue("The owner person type check failed");
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValueOnce(
        "The demonstration type check failed"
      );

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for createDeliverable have failed."
        );
        expect(error.extensions.code).toBe("CREATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The demo status check failed",
          "The owner person type check failed",
          "The demonstration type check failed",
        ]);
      }
    });
  });
});
