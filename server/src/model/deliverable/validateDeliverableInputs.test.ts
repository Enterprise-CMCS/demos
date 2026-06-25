// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { DeepPartial } from "../../testUtilities";

// Types
import { GraphQLContext } from "../../auth";
import { ApplicationStatus, PersonType } from "../../types";
import {
  ParsedApproveDeliverableExtensionInput,
  ParsedCreateDeliverableInput,
  ParsedRequestDeliverableExtensionInput,
  ParsedRequestDeliverableResubmissionInput,
  ParsedUpdateDeliverableInput,
} from ".";
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLError } from "graphql";
import { EasternTZDate } from "../../dateUtilities";

// Functions under test
import {
  validateApproveDeliverableExtensionInput,
  validateCompleteDeliverableInput,
  validateCreateDeliverableInput,
  validateDeleteDeliverableInput,
  validateDenyDeliverableExtensionInput,
  validateRequestDeliverableExtensionInput,
  validateRequestDeliverableResubmissionInput,
  validateStartDeliverableReviewInput,
  validateSubmitDeliverableInput,
  validateUpdateDeliverableInput,
  validateUserPersonTypeAllowed,
} from "./validateDeliverableInputs";

// Mock imports
vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

vi.mock("../demonstration", () => ({
  checkDemonstrationStatus: vi.fn(),
}));

vi.mock("../user/queries", () => ({
  selectUserOrThrow: vi.fn(),
}));

vi.mock("../demonstrationTypeTagAssignment", () => ({
  getDemonstrationTypeAssignments: vi.fn(),
}));

vi.mock(".", () => ({
  checkDeliverableExtensionHasStatus: vi.fn(),
  checkDeliverableHasAtLeastOneDocument: vi.fn(),
  checkDeliverableHasNoActiveExtension: vi.fn(),
  checkDeliverableHasNoComments: vi.fn(),
  checkDeliverableHasNoDocuments: vi.fn(),
  checkDeliverableHasStatus: vi.fn(),
  checkDueDateInFuture: vi.fn(),
  checkNewDueDateIsAtLeastCurrentDueDate: vi.fn(),
  checkNewDueDateIsGreaterThanCurrentDueDate: vi.fn(),
  checkOwnerPersonType: vi.fn(),
  checkRequestedDeliverableDemonstrationType: vi.fn(),
  checkRequiredDeliverableDemonstrationTypes: vi.fn(),
  selectDeliverableOrThrow: vi.fn(),
}));

import { getApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import {
  checkDeliverableExtensionHasStatus,
  checkDeliverableHasAtLeastOneDocument,
  checkDeliverableHasNoActiveExtension,
  checkDeliverableHasNoComments,
  checkDeliverableHasNoDocuments,
  checkDeliverableHasStatus,
  checkDueDateInFuture,
  checkNewDueDateIsAtLeastCurrentDueDate,
  checkNewDueDateIsGreaterThanCurrentDueDate,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  checkRequiredDeliverableDemonstrationTypes,
  selectDeliverableOrThrow,
} from ".";
import { ACTIVE_DELIVERABLE_STATUSES } from "../../constants";
import { checkDemonstrationStatus } from "../demonstration";

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

  describe("validateUserPersonTypeAllowed", () => {
    const testContext: DeepPartial<GraphQLContext> = {
      user: {
        id: "0a3bd415-39a3-4f72-a067-418a5219216a",
        personTypeId: "demos-admin",
      },
    };

    it("should not throw if the context is one of the permitted person types", () => {
      const result = validateUserPersonTypeAllowed(testContext as GraphQLContext, "Combobulate", [
        "demos-admin",
      ]);
      expect(result).toBeUndefined();
    });

    it("should throw if the context is not of the permitted person types", () => {
      try {
        validateUserPersonTypeAllowed(testContext as GraphQLContext, "Discombobulate", [
          "demos-cms-user",
        ]);
        throw new Error("Expected validateUserPersonTypeAllowed to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        const error = e as Error;
        expect(error.message).toBe(
          "A user of type demos-admin is not permitted to perform the action Discombobulate."
        );
      }
    });
  });

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
      vi.mocked(selectUserOrThrow).mockResolvedValue(mockUser as PrismaUser);
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
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith(
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
      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(
        mockDemonstration,
        "deliverable"
      );
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
      expect(checkDemonstrationStatus).toHaveBeenCalledExactlyOnceWith(
        mockDemonstration,
        "deliverable"
      );
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

    it("should throw if the required demonstration type check fails", async () => {
      vi.mocked(checkRequiredDeliverableDemonstrationTypes).mockReturnValue(
        "The required demonstration type check failed!"
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
          "The required demonstration type check failed!",
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
      vi.mocked(checkRequiredDeliverableDemonstrationTypes).mockReturnValue(
        "The required demonstration type check failed!"
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
          "The required demonstration type check failed!",
          "The demonstration type check failed",
        ]);
      }
    });
  });

  describe("validateUpdateDeliverableInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(selectUserOrThrow).mockResolvedValue(mockUser as PrismaUser);
      vi.mocked(selectDeliverableOrThrow).mockResolvedValue(mockDeliverable as PrismaDeliverable);
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

    it("should always get the deliverable information from the DB", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);

      expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith(
        { id: mockDeliverable.id },
        mockTransaction
      );
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

    it("should always check the deliverable status", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(
        mockDeliverable,
        ACTIVE_DELIVERABLE_STATUSES
      );
    });

    it("should get the user info if a new owner is passed, and call the check function", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };

      await validateUpdateDeliverableInput(mockDeliverable.id!, testInput, mockTransaction);
      expect(selectUserOrThrow).toHaveBeenCalledExactlyOnceWith(
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
      expect(selectDeliverableOrThrow).toHaveBeenCalledExactlyOnceWith(
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
      expect(getDemonstrationTypeAssignments).not.toHaveBeenCalled();
      expect(checkRequestedDeliverableDemonstrationType).not.toHaveBeenCalled();
    });

    it("should throw if the deliverable status check fails", async () => {
      const testInput: ParsedUpdateDeliverableInput = {
        name: "A new name!",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

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
          "The deliverable status check failed!",
        ]);
      }
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
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
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
          "The deliverable status check failed!",
          "The owner person type check failed",
          "The demonstration type check failed",
        ]);
      }
    });
  });

  describe("validateSubmitDeliverableInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Upcoming",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };

      await expect(
        validateSubmitDeliverableInput(testInput as PrismaDeliverable, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should call the check functions", async () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Upcoming",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };

      await validateSubmitDeliverableInput(testInput as PrismaDeliverable, mockTransaction);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(
        testInput,
        ACTIVE_DELIVERABLE_STATUSES
      );
      expect(checkDeliverableHasAtLeastOneDocument).toHaveBeenCalledExactlyOnceWith(
        testInput,
        mockTransaction
      );
    });

    it("should throw if the deliverable status check fails", async () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Approved",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        await validateSubmitDeliverableInput(testInput as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateSubmitDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for submitDeliverable have failed."
        );
        expect(error.extensions.code).toBe("SUBMIT_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });

    it("should throw if the deliverable document check failes", async () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Submitted",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };
      vi.mocked(checkDeliverableHasAtLeastOneDocument).mockResolvedValue(
        "The deliverable document check has failed!"
      );

      try {
        await validateSubmitDeliverableInput(testInput as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateSubmitDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for submitDeliverable have failed."
        );
        expect(error.extensions.code).toBe("SUBMIT_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable document check has failed!",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Approved",
        cmsOwnerUserId: "7d8fdea5-ca19-42e5-af50-98836b6d47db",
      };
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
      vi.mocked(checkDeliverableHasAtLeastOneDocument).mockResolvedValue(
        "The deliverable document check has failed!"
      );

      try {
        await validateSubmitDeliverableInput(testInput as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateSubmitDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for submitDeliverable have failed."
        );
        expect(error.extensions.code).toBe("SUBMIT_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
          "The deliverable document check has failed!",
        ]);
      }
    });
  });

  describe("validateStartDeliverableReviewInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Submitted",
      };

      expect(validateStartDeliverableReviewInput(testInput as PrismaDeliverable)).toBeUndefined();
    });

    it("should call the check functions", () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Submitted",
      };

      validateStartDeliverableReviewInput(testInput as PrismaDeliverable);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(testInput, ["Submitted"]);
    });

    it("should throw if the deliverable status check fails", () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Upcoming",
      };
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        validateStartDeliverableReviewInput(testInput as PrismaDeliverable);
        throw new Error("Expected validateStartDeliverableReviewInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for startDeliverableReview have failed."
        );
        expect(error.extensions.code).toBe("START_DELIVERABLE_REVIEW_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });
  });

  describe("validateCompleteDeliverableInput", () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Under CMS Review",
      };

      expect(validateCompleteDeliverableInput(testInput as PrismaDeliverable)).toBeUndefined();
    });

    it("should call the check functions", () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Under CMS Review",
      };

      validateCompleteDeliverableInput(testInput as PrismaDeliverable);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(testInput, [
        "Under CMS Review",
      ]);
    });

    it("should throw if the deliverable status check fails", () => {
      const testInput: Partial<PrismaDeliverable> = {
        id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
        statusId: "Submitted",
      };
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        validateCompleteDeliverableInput(testInput as PrismaDeliverable);
        throw new Error("Expected validateCompleteDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for completeDeliverable have failed."
        );
        expect(error.extensions.code).toBe("COMPLETE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });
  });

  describe("validateRequestDeliverableResubmissionInput", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
    };
    const testInput: ParsedRequestDeliverableResubmissionInput = {
      details: "Some details",
      newDueDate: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2026, 11, 1, 0, 0, 0, 0, "America/New_York"),
      },
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      expect(
        validateRequestDeliverableResubmissionInput(testDeliverable as PrismaDeliverable, testInput)
      ).toBeUndefined();
    });

    it("should call the check functions", () => {
      validateRequestDeliverableResubmissionInput(testDeliverable as PrismaDeliverable, testInput);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(testDeliverable, [
        "Submitted",
        "Under CMS Review",
      ]);
      expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.newDueDate);
      expect(checkNewDueDateIsAtLeastCurrentDueDate).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        testInput.newDueDate
      );
    });

    it("should throw if the deliverable status check fails", () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        validateRequestDeliverableResubmissionInput(
          testDeliverable as PrismaDeliverable,
          testInput
        );
        throw new Error(
          "Expected validateRequestDeliverableResubmissionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableResubmission have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_RESUBMISSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });

    it("should throw if the future due date check fails", () => {
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");

      try {
        validateRequestDeliverableResubmissionInput(
          testDeliverable as PrismaDeliverable,
          testInput
        );
        throw new Error(
          "Expected validateRequestDeliverableResubmissionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableResubmission have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_RESUBMISSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The future due date check failed!",
        ]);
      }
    });

    it("should throw if the current vs new due date check fails", () => {
      vi.mocked(checkNewDueDateIsAtLeastCurrentDueDate).mockReturnValue(
        "The current and new due date check failed!"
      );

      try {
        validateRequestDeliverableResubmissionInput(
          testDeliverable as PrismaDeliverable,
          testInput
        );
        throw new Error(
          "Expected validateRequestDeliverableResubmissionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableResubmission have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_RESUBMISSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The current and new due date check failed!",
        ]);
      }
    });

    it("should combine all errors into one object", () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");
      vi.mocked(checkNewDueDateIsAtLeastCurrentDueDate).mockReturnValue(
        "The current and new due date check failed!"
      );

      try {
        validateRequestDeliverableResubmissionInput(
          testDeliverable as PrismaDeliverable,
          testInput
        );
        throw new Error(
          "Expected validateRequestDeliverableResubmissionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableResubmission have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_RESUBMISSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
          "The future due date check failed!",
          "The current and new due date check failed!",
        ]);
      }
    });
  });

  describe("validateRequestDeliverableExtensionInput", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "86e6a9f2-ea55-40de-a802-507d5b2cd852",
    };
    const testInput: ParsedRequestDeliverableExtensionInput = {
      reason: "Technical Difficulties",
      details: "Some details",
      requestedDueDate: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2026, 11, 1, 0, 0, 0, 0, "America/New_York"),
      },
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      await expect(
        validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        )
      ).resolves.toBeUndefined();
    });

    it("should call the check functions", async () => {
      await validateRequestDeliverableExtensionInput(
        testDeliverable as PrismaDeliverable,
        testInput,
        mockTransaction
      );
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(testDeliverable, [
        "Upcoming",
        "Past Due",
      ]);
      expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.requestedDueDate);
      expect(checkNewDueDateIsGreaterThanCurrentDueDate).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        testInput.requestedDueDate
      );
    });

    it("should throw if the active extension check fails", async () => {
      vi.mocked(checkDeliverableHasNoActiveExtension).mockResolvedValue(
        "The active extenson check failed!"
      );

      try {
        await validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        );
        throw new Error(
          "Expected validateRequestDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The active extenson check failed!",
        ]);
      }
    });

    it("should throw if the deliverable status check fails", async () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        await validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        );
        throw new Error(
          "Expected validateRequestDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });

    it("should throw if the future due date check fails", async () => {
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");

      try {
        await validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        );
        throw new Error(
          "Expected validateRequestDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The future due date check failed!",
        ]);
      }
    });

    it("should throw if the current vs new due date check fails", async () => {
      vi.mocked(checkNewDueDateIsGreaterThanCurrentDueDate).mockReturnValue(
        "The current and new due date check failed!"
      );

      try {
        await validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        );
        throw new Error(
          "Expected validateRequestDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The current and new due date check failed!",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDeliverableHasNoActiveExtension).mockResolvedValue(
        "The active extenson check failed!"
      );
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");
      vi.mocked(checkNewDueDateIsGreaterThanCurrentDueDate).mockReturnValue(
        "The current and new due date check failed!"
      );

      try {
        await validateRequestDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testInput,
          mockTransaction
        );
        throw new Error(
          "Expected validateRequestDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for requestDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
          "The active extenson check failed!",
          "The future due date check failed!",
          "The current and new due date check failed!",
        ]);
      }
    });
  });

  describe("validateApproveDeliverableExtensionInput", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "edc74187-52b7-4310-8262-d1d5feee7084",
    };
    const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
      id: "7e08fcc3-0e7d-4ed6-9a18-bc2033d0024a",
    };
    const testInput: ParsedApproveDeliverableExtensionInput = {
      deliverableExtensionId: (testDeliverableExtension as PrismaDeliverable).id,
      finalDateGranted: {
        isEasternTZDate: true,
        easternTZDate: new TZDate(2026, 11, 1, 0, 0, 0, 0, "America/New_York"),
      },
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      expect(
        validateApproveDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension,
          testInput
        )
      ).toBeUndefined();
    });

    it("should call the check functions", () => {
      validateApproveDeliverableExtensionInput(
        testDeliverable as PrismaDeliverable,
        testDeliverableExtension as PrismaDeliverableExtension,
        testInput
      );
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        ACTIVE_DELIVERABLE_STATUSES
      );
      expect(checkDeliverableExtensionHasStatus).toHaveBeenCalledExactlyOnceWith(
        testDeliverableExtension,
        ["Requested"]
      );
      expect(checkDueDateInFuture).toHaveBeenCalledExactlyOnceWith(testInput.finalDateGranted);
    });

    it("should throw if the deliverable status check fails", () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        validateApproveDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension,
          testInput
        );
        throw new Error(
          "Expected validateApproveDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for approveDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("APPROVE_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });

    it("should throw if the deliverable extension status check fails", () => {
      vi.mocked(checkDeliverableExtensionHasStatus).mockReturnValue(
        "The deliverable extension status check failed!"
      );

      try {
        validateApproveDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension,
          testInput
        );
        throw new Error(
          "Expected validateApproveDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for approveDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("APPROVE_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable extension status check failed!",
        ]);
      }
    });

    it("should throw if the future due date check fails", async () => {
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");

      try {
        validateApproveDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension,
          testInput
        );
        throw new Error(
          "Expected validateApproveDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for approveDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("APPROVE_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The future due date check failed!",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
      vi.mocked(checkDeliverableExtensionHasStatus).mockReturnValue(
        "The deliverable extension status check failed!"
      );
      vi.mocked(checkDueDateInFuture).mockReturnValue("The future due date check failed!");

      try {
        validateApproveDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension,
          testInput
        );
        throw new Error(
          "Expected validateApproveDeliverableExtensionInput to throw, but it did not."
        );
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for approveDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("APPROVE_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
          "The deliverable extension status check failed!",
          "The future due date check failed!",
        ]);
      }
    });
  });

  describe("validateDenyDeliverableExtensionInput", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "edc74187-52b7-4310-8262-d1d5feee7084",
    };
    const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
      id: "7e08fcc3-0e7d-4ed6-9a18-bc2033d0024a",
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      expect(
        validateDenyDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension
        )
      ).toBeUndefined();
    });

    it("should call the check functions", () => {
      validateDenyDeliverableExtensionInput(
        testDeliverable as PrismaDeliverable,
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        ACTIVE_DELIVERABLE_STATUSES
      );
      expect(checkDeliverableExtensionHasStatus).toHaveBeenCalledExactlyOnceWith(
        testDeliverableExtension,
        ["Requested"]
      );
    });

    it("should throw if the deliverable status check fails", () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");

      try {
        validateDenyDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension
        );
        throw new Error("Expected validateDenyDeliverableExtensionInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for denyDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("DENY_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
        ]);
      }
    });

    it("should throw if the deliverable extension status check fails", () => {
      vi.mocked(checkDeliverableExtensionHasStatus).mockReturnValue(
        "The deliverable extension status check failed!"
      );

      try {
        validateDenyDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension
        );
        throw new Error("Expected validateDenyDeliverableExtensionInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for denyDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("DENY_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable extension status check failed!",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue("The deliverable status check failed!");
      vi.mocked(checkDeliverableExtensionHasStatus).mockReturnValue(
        "The deliverable extension status check failed!"
      );

      try {
        validateDenyDeliverableExtensionInput(
          testDeliverable as PrismaDeliverable,
          testDeliverableExtension as PrismaDeliverableExtension
        );
        throw new Error("Expected validateDenyDeliverableExtensionInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for denyDeliverableExtension have failed."
        );
        expect(error.extensions.code).toBe("DENY_DELIVERABLE_EXTENSION_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check failed!",
          "The deliverable extension status check failed!",
        ]);
      }
    });
  });

  describe("validateDeleteDeliverableInput", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "40aaed7d-b0ad-47e0-aaa0-c2433db20cb7",
    };

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should not throw if none of the rules are violated", async () => {
      // Note: don't need to set returns to undefined, as this is what vi.fn() does already
      await expect(
        validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction)
      ).resolves.toBeUndefined();
    });

    it("should call the check functions", async () => {
      await validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction);
      expect(checkDeliverableHasStatus).toHaveBeenCalledExactlyOnceWith(testDeliverable, [
        "Upcoming",
        "Past Due",
      ]);
      expect(checkDeliverableHasNoDocuments).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        mockTransaction
      );
      expect(checkDeliverableHasNoComments).toHaveBeenCalledExactlyOnceWith(
        testDeliverable,
        mockTransaction
      );
    });

    it("should throw if the deliverable status check fails", async () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue(
        "The deliverable status check has failed!"
      );

      try {
        await validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateDeleteDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for deleteDeliverable have failed."
        );
        expect(error.extensions.code).toBe("DELETE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check has failed!",
        ]);
      }
    });

    it("should throw if the no documents check fails", async () => {
      vi.mocked(checkDeliverableHasNoDocuments).mockResolvedValue(
        "The check for no documents has failed!"
      );

      try {
        await validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateDeleteDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for deleteDeliverable have failed."
        );
        expect(error.extensions.code).toBe("DELETE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The check for no documents has failed!",
        ]);
      }
    });

    it("should throw if the no comments check fails", async () => {
      vi.mocked(checkDeliverableHasNoComments).mockResolvedValue(
        "The check for no comments has failed!"
      );

      try {
        await validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateDeleteDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for deleteDeliverable have failed."
        );
        expect(error.extensions.code).toBe("DELETE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The check for no comments has failed!",
        ]);
      }
    });

    it("should combine all errors into one object", async () => {
      vi.mocked(checkDeliverableHasStatus).mockReturnValue(
        "The deliverable status check has failed!"
      );
      vi.mocked(checkDeliverableHasNoDocuments).mockResolvedValue(
        "The check for no documents has failed!"
      );
      vi.mocked(checkDeliverableHasNoComments).mockResolvedValue(
        "The check for no comments has failed!"
      );

      try {
        await validateDeleteDeliverableInput(testDeliverable as PrismaDeliverable, mockTransaction);
        throw new Error("Expected validateDeleteDeliverableInput to throw, but it did not.");
      } catch (e) {
        expect(e).toBeInstanceOf(GraphQLError);
        const error = e as GraphQLError;
        expect(error.message).toBe(
          "One or more validation checks for deleteDeliverable have failed."
        );
        expect(error.extensions.code).toBe("DELETE_DELIVERABLE_VALIDATION_FAILED");
        expect(error.extensions.originalMessages).toStrictEqual([
          "The deliverable status check has failed!",
          "The check for no documents has failed!",
          "The check for no comments has failed!",
        ]);
      }
    });
  });
});
