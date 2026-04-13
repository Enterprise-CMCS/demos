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

import { getApplication } from "../application";
import { getUser } from "../user";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";

describe("validateDeliverableInputs", () => {
  // Global mocks to extend for future tests
  const mockDemonstration: Partial<PrismaDemonstration> = {
    id: "791b5e55-680d-47f3-bfba-9f242b69b8b2",
  };
  const mockUser: Partial<PrismaUser> = {
    id: "e132432c-e26a-4f1e-958b-7c5b68019272",
  };

  // Mock transaction
  const mockTransaction: any = "Test!";

  describe("validateCreateDeliverableInput", () => {
    // Test inputs
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

    // Mock return values for testing
    const mockApprovedDemonstration = {
      ...mockDemonstration,
      statusId: "Approved" satisfies ApplicationStatus,
    };
    const mockUnderReviewDemonstration = {
      ...mockDemonstration,
      statusId: "Under Review" satisfies ApplicationStatus,
    };

    const mockAdminUser = {
      ...mockUser,
      personTypeId: "demos-admin" satisfies PersonType,
    };
    const mockCmsUser = {
      ...mockUser,
      personTypeId: "demos-cms-user" satisfies PersonType,
    };
    const mockStateUser = {
      ...mockUser,
      personTypeId: "demos-state-user" satisfies PersonType,
    };

    const mockExpectedDemonstrationTypeAssignments: Partial<PrismaDemonstrationTypeTagAssignment>[] =
      [
        {
          demonstrationId: mockDemonstration.id,
          tagNameId: "Free Insulin",
        },
        {
          demonstrationId: mockDemonstration.id,
          tagNameId: "Subsidy Program for At Home Diagnostics",
        },
      ];

    const mockUnexpectedDemonstrationTypeAssignments: Partial<PrismaDemonstrationTypeTagAssignment>[] =
      [
        {
          demonstrationId: mockDemonstration.id,
          tagNameId: "Free Cardiac Screenings",
        },
        {
          demonstrationId: mockDemonstration.id,
          tagNameId: "Subsidy Program for At Home Diagnostics",
        },
      ];

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", async () => {
      // Approved demonstration, expected demonstration types, allowed users
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockExpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );

      // Check for CMS user
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);
      await expect(
        validateCreateDeliverableInput(testInput, mockTransaction)
      ).resolves.toBeUndefined();

      // Check for admin user
      vi.mocked(getUser).mockResolvedValue(mockAdminUser as PrismaUser);
      await expect(
        validateCreateDeliverableInput(testInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should get the demonstration, user, and demonstration type info", async () => {
      // Approved demonstration, expected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockExpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);

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

    it("should not throw about demonstration types if they are not provided", async () => {
      // Approved demonstration, expected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockExpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);
      const updatedTestInput = {
        ...testInput,
        demonstrationTypes: undefined,
      };

      await expect(
        validateCreateDeliverableInput(updatedTestInput, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should throw if given a state user", async () => {
      // Approved demonstration, expected demonstration types, state user
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockExpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockStateUser as PrismaUser);

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
          `User ${testInput.cmsOwnerUserId} is not a CMS user; cannot own deliverable.`,
        ]);
      }
    });

    it("should throw if given an unexpected demonstration status", async () => {
      // Under Review demonstration, expected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(
        mockUnderReviewDemonstration as PrismaDemonstration
      );
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockExpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);

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
          `Demonstration ${testInput.demonstrationId} is not in Approved status; cannot create deliverable.`,
        ]);
      }
    });

    it("should throw if given a demonstration type not belonging to the demonstration", async () => {
      // Approved demonstration, unexpected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockUnexpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);

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
          "Demonstration Type Free Insulin does not exist on demonstration " +
            `${testInput.demonstrationId}; cannot be assigned to deliverable.`,
        ]);
      }
    });

    it("should only throw an error for the mismatched demonstration types", async () => {
      // Approved demonstration, unexpected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(mockApprovedDemonstration as PrismaDemonstration);
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockUnexpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.extensions.originalMessages).not.toContain(
          "Demonstration Type Subsidy Program for At Home Diagnostics does not exist on demonstration " +
            `${testInput.demonstrationId}; cannot be assigned to deliverable.`
        );
      }
    });

    it("should combine all errors into one object", async () => {
      // Under Review demonstration, unexpected demonstration types, CMS user
      vi.mocked(getApplication).mockResolvedValue(
        mockUnderReviewDemonstration as PrismaDemonstration
      );
      vi.mocked(getDemonstrationTypeAssignments).mockResolvedValue(
        mockUnexpectedDemonstrationTypeAssignments as PrismaDemonstrationTypeTagAssignment[]
      );
      vi.mocked(getUser).mockResolvedValue(mockCmsUser as PrismaUser);

      try {
        await validateCreateDeliverableInput(testInput, mockTransaction);
        throw new Error("Expected validateCreateDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.extensions.originalMessages).toStrictEqual([
          `Demonstration ${testInput.demonstrationId} is not in Approved status; cannot create deliverable.`,
          "Demonstration Type Free Insulin does not exist on demonstration " +
            `${testInput.demonstrationId}; cannot be assigned to deliverable.`,
        ]);
      }
    });
  });
});
