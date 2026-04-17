// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { ApplicationStatus, PersonType } from "../../types";
import { ParsedCreateDeliverableInput, ParsedUpdateDeliverableInput } from ".";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLError } from "graphql";
import { EasternTZDate } from "../../dateUtilities";

// Functions under test
import {
  validateCreateDeliverableInput,
  validateUpdateDeliverableInput,
} from "./validateDeliverableInputs";

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
  checkDueDateInFuture: vi.fn(),
  checkOwnerPersonType: vi.fn(),
  checkRequestedDeliverableDemonstrationType: vi.fn(),
  getDeliverable: vi.fn(),
}));

import { getApplication } from "../application";
import { getUser } from "../user";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import {
  checkDemonstrationStatus,
  checkDueDateInFuture,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  getDeliverable,
} from ".";

describe("validateDeliverableInputs", () => {
  const testEasternDate: EasternTZDate = {
    isEasternTZDate: true,
    easternTZDate: new TZDate(2026, 10, 12, 23, 59, 59, 999, "America/New_York"),
  };
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
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: "dd01f825-a931-4d67-b9bd-fe2cf6e4e61d",
    demonstrationId: mockDemonstration.id,
  };
  const mockTransaction: any = "Test!";

  describe("validateCreateDeliverableInput", () => {
    const testInput: ParsedCreateDeliverableInput = {
      name: "A test deliverable",
      deliverableType: "Evaluation Design",
      demonstrationId: mockDemonstration.id!,
      cmsOwnerUserId: mockUser.id!,
      dueDate: testEasternDate,
      demonstrationTypes: new Set(["Free Insulin", "Subsidy Program for At Home Diagnostics"]),
    };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(getApplication).mockResolvedValue(mockDemonstration as PrismaDemonstration);
      vi.mocked(getUser).mockResolvedValue(mockUser as PrismaUser);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockDemonstrationTypeTagAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
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

    it("should call the checking functions, using the results of the queries if appropriate", async () => {
      await validateCreateDeliverableInput(testInput, mockTransaction);
      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(mockDemonstration);
      expect(checkOwnerPersonType).toHaveBeenCalledExactlyOnceWith(mockUser);
      expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testEasternDate);
      expect(vi.mocked(checkRequestedDeliverableDemonstrationType).mock.calls).toStrictEqual([
        [
          Array.from(testInput.demonstrationTypes!)[0],
          mockDemonstrationTypeTagAssignments,
          mockDemonstration.id,
        ],
        [
          Array.from(testInput.demonstrationTypes!)[1],
          mockDemonstrationTypeTagAssignments,
          mockDemonstration.id,
        ],
      ]);
    });

    it("should only call the demonstration type functions if demonstration types are passed", async () => {
      const modifiedTestInput: ParsedCreateDeliverableInput = {
        name: testInput.name,
        deliverableType: testInput.deliverableType,
        demonstrationId: testInput.demonstrationId,
        cmsOwnerUserId: testInput.cmsOwnerUserId,
        dueDate: testInput.dueDate,
      };

      await validateCreateDeliverableInput(modifiedTestInput, mockTransaction);
      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(mockDemonstration);
      expect(checkOwnerPersonType).toHaveBeenCalledExactlyOnceWith(mockUser);
      expect(checkRequestedDeliverableDemonstrationType).not.toHaveBeenCalled();
    });

    it("should do nothing on demonstration types if an empty set is passed", async () => {
      const modifiedTestInput: ParsedCreateDeliverableInput = {
        name: testInput.name,
        deliverableType: testInput.deliverableType,
        demonstrationId: testInput.demonstrationId,
        cmsOwnerUserId: testInput.cmsOwnerUserId,
        dueDate: testInput.dueDate,
        demonstrationTypes: new Set([]),
      };

      await validateCreateDeliverableInput(modifiedTestInput, mockTransaction);
      expect(checkRequestedDeliverableDemonstrationType).not.toHaveBeenCalled();
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

    it("should throw if the future due date check fails", async () => {
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed");

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
          "The future due date check failed",
        ]);
      }
    });

    it("should throw if the allowed demonstration type check fails", async () => {
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

    it("should only throw for the allowed demonstration type checks that fail", async () => {
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
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed");
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
          "The future due date check failed",
          "The demonstration type check failed",
        ]);
      }
    });
  });

  describe("validateUpdateDeliverableInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(getUser).mockResolvedValue(mockUser as PrismaUser);
      vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockDemonstrationTypeTagAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
    });

    it("should not throw if the payload includes nothing being checked", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
      };

      await expect(
        validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
        demonstrationTypes: new Set(["Low Cost Screening for Hepatitis"]),
      };

      await expect(
        validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should get the user info if a new owner is passed, and call the check function", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
      expect(getUser).toHaveBeenCalledExactlyOnceWith(
        { id: testInput.cmsOwnerUserId },
        mockTransaction
      );
      expect(checkOwnerPersonType).toHaveBeenCalledExactlyOnceWith(mockUser);
    });

    it("should get the demonstration types if new ones are passed, and call the check functions", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        demonstrationTypes: new Set([
          "Low Cost Screening for Hepatitis",
          "Needle Exchange Programs",
        ]),
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
      expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
        { id: mockDeliverable.id! },
        mockTransaction
      );
      expect(getDemonstrationTypeAssignments).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: mockDeliverable.demonstrationId },
        mockTransaction
      );
      expect(vi.mocked(checkRequestedDeliverableDemonstrationType).mock.calls).toStrictEqual([
        [
          Array.from(testInput.demonstrationTypes!)[0],
          mockDemonstrationTypeTagAssignments,
          mockDeliverable.demonstrationId,
        ],
        [
          Array.from(testInput.demonstrationTypes!)[1],
          mockDemonstrationTypeTagAssignments,
          mockDeliverable.demonstrationId,
        ],
      ]);
    });

    it("should do nothing on demonstration types if an empty set is passed", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        demonstrationTypes: new Set([]),
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
      expect(getDeliverable).not.toHaveBeenCalled();
      expect(getDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(checkRequestedDeliverableDemonstrationType).not.toHaveBeenCalled();
    });

    it("should throw if the owner person type check runs and fails", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };
      vi.mocked(checkOwnerPersonType).mockReturnValue("The owner person type check failed");

      try {
        await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
        throw new Error("Expected validateUpdateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for updateDeliverable have failed."
        );
        expect(error.extensions.code).toBe("UPDATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The owner person type check failed",
        ]);
      }
    });

    it("should throw if the allowed demonstration type check runs and fails", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        demonstrationTypes: new Set([
          "Low Cost Screening for Hepatitis",
          "Needle Exchange Programs",
        ]),
      };
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValue(
        "The demonstration type check failed"
      );

      try {
        await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
        throw new Error("Expected validateUpdateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for updateDeliverable have failed."
        );
        expect(error.extensions.code).toBe("UPDATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The demonstration type check failed",
          "The demonstration type check failed",
        ]);
      }
    });

    it("should only throw for the allowed demonstration type checks that fail", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        demonstrationTypes: new Set([
          "Low Cost Screening for Hepatitis",
          "Needle Exchange Programs",
        ]),
      };
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValueOnce(
        "The demonstration type check failed"
      );

      try {
        await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
        throw new Error("Expected validateUpdateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for updateDeliverable have failed."
        );
        expect(error.extensions.code).toBe("UPDATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The demonstration type check failed",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
        demonstrationTypes: new Set([
          "Low Cost Screening for Hepatitis",
          "Needle Exchange Programs",
        ]),
        dueDate: {
          newDueDate: testEasternDate,
          dateChangeNote: "Note is required",
        },
      };
      vi.mocked(checkOwnerPersonType).mockReturnValue("The owner person type check failed");
      vi.mocked(checkRequestedDeliverableDemonstrationType).mockReturnValueOnce(
        "The demonstration type check failed"
      );

      try {
        await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
        throw new Error("Expected validateUpdateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for updateDeliverable have failed."
        );
        expect(error.extensions.code).toBe("UPDATE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The owner person type check failed",
          "The demonstration type check failed",
        ]);
      }
    });
  });
});
