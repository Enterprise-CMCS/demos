// Vitest and other helpers
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EasternTZDate, parseJSDateToEasternTZDate } from "../../dateUtilities";

// Types
import {
  DeliverableExtensionStatus,
  DeliverableStatus,
  PersonType,
  TagName,
} from "../../types";
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  Document as PrismaDocument,
  PrivateComment as PrismaPrivateComment,
  User as PrismaUser,
} from "@prisma/client";

// Functions under test
import {
  checkDeliverableExtensionHasStatus,
  checkDeliverableHasAtLeastOneDocument,
  checkDeliverableHasNoActiveExtension,
  checkDeliverableHasNoComments,
  checkDeliverableHasNoDocuments,
  checkDeliverableHasStatus,
  checkDueDateInFuture,
  checkForDuplicateDemonstrationTypes,
  checkNewDueDateIsAtLeastCurrentDueDate,
  checkNewDueDateIsGreaterThanCurrentDueDate,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  checkRequiredDeliverableDemonstrationTypes,
} from "./checkDeliverableInputFunctions";

// Mock imports
vi.mock("../document", () => ({
  selectManyDocuments: vi.fn(),
}));

vi.mock("../deliverableExtension/queries", () => ({
  selectManyDeliverableExtensions: vi.fn(),
}));

vi.mock("../publicComment/queries", () => ({
  selectManyPublicComments: vi.fn(),
}));

vi.mock("../privateComment/queries", () => ({
  selectManyPrivateComments: vi.fn(),
}));

import { selectManyDocuments } from "../document";
import { selectManyDeliverableExtensions } from "../deliverableExtension/queries";
import { selectManyPublicComments } from "../publicComment/queries";
import { selectManyPrivateComments } from "../privateComment/queries";

describe("checkDeliverableInputFunctions", () => {
  describe("checkDeliverableHasStatus", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "1e42da3a-9355-4c5d-a541-812a9f95ef56",
      statusId: "Under CMS Review",
    };

    it("should return undefined if the passed status matches the object", () => {
      const result = checkDeliverableHasStatus(testDeliverable as PrismaDeliverable, [
        "Under CMS Review",
      ]);
      expect(result).toBeUndefined();
    });

    it("should return an error message the passed status does not match the object", () => {
      const result = checkDeliverableHasStatus(testDeliverable as PrismaDeliverable, [
        "Approved",
        "Accepted",
        "Received and Filed",
      ]);
      expect(result).toBe(
        "Deliverable expected to have one of status Approved, Accepted, " +
          "Received and Filed; actual status was Under CMS Review."
      );
    });
  });

  describe("checkOwnerPersonType", () => {
    it("should return undefined if the owner user is an admin", () => {
      const testInput: Partial<PrismaUser> = {
        id: "abc123",
        personTypeId: "demos-admin" satisfies PersonType,
      };
      const result = checkOwnerPersonType(testInput as PrismaUser);
      expect(result).toBeUndefined();
    });

    it("should return undefined if the owner user is a CMS user", () => {
      const testInput: Partial<PrismaUser> = {
        id: "abc123",
        personTypeId: "demos-cms-user" satisfies PersonType,
      };
      const result = checkOwnerPersonType(testInput as PrismaUser);
      expect(result).toBeUndefined();
    });

    it("should return an error string if the owner user is a state user", () => {
      const testInput: Partial<PrismaUser> = {
        id: "abc123",
        personTypeId: "demos-state-user" satisfies PersonType,
      };
      const result = checkOwnerPersonType(testInput as PrismaUser);
      expect(result).toBe("User abc123 is not a CMS user; cannot own deliverable.");
    });
  });

  describe("checkRequestedDeliverableDemonstrationType", () => {
    const testDemonstrationTypeTagAssignment: Partial<PrismaDemonstrationTypeTagAssignment>[] = [
      {
        tagNameId: "Test Tag One",
      },
      {
        tagNameId: "Test Tag Two",
      },
    ];
    const testDemonstration: Partial<PrismaDemonstration> = {
      id: "abc123",
    };

    it("should return undefined if the requested demonstration type is available", () => {
      const result = checkRequestedDeliverableDemonstrationType(
        "Test Tag One",
        testDemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment[],
        testDemonstration.id!
      );
      expect(result).toBeUndefined();
    });

    it("should return an error string if the demonstration type is not available", () => {
      const result = checkRequestedDeliverableDemonstrationType(
        "Test Tag Three",
        testDemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment[],
        testDemonstration.id!
      );
      expect(result).toBe(
        "Demonstration type Test Tag Three does not exist on " +
          "demonstration abc123; cannot be assigned to deliverable."
      );
    });
  });

  describe("checkForDuplicateDemonstrationTypes", () => {
    it("should return undefined if the input has no duplicates", () => {
      const testInput: TagName[] = ["Free Insulin", "Low Cost Thermometers to Newborn Children"];

      const result = checkForDuplicateDemonstrationTypes(testInput);
      expect(result).toBeUndefined();
    });

    it("should return an appropriate error string if the input has duplicates", () => {
      const testInput: TagName[] = [
        "Free Insulin",
        "Low Cost Thermometers to Newborn Children",
        "Free Insulin",
        "Nutrition Counseling",
        "Nutrition Counseling",
      ];

      const result = checkForDuplicateDemonstrationTypes(testInput);
      expect(result).toBe(
        "Duplicate demonstration types were included on the input: Free Insulin, Nutrition Counseling."
      );
    });
  });

  describe("checkDueDateInFuture", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 9, 13, 12, 5, 17, 232));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return undefined if the due date is in the future", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2025, 8, 17, 3, 22, 11, 13)
      );

      const result = checkDueDateInFuture(testInput);
      expect(result).toBeUndefined();
    });

    it("should return an appropriate error message if the due date is in the past", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2023, 8, 17, 3, 22, 11, 13)
      );

      const result = checkDueDateInFuture(testInput);
      expect(result).toBe(
        "Cannot request a due date in the past; requested Sat Sep 16 2023 23:22:11 GMT-0400 (Eastern Daylight Time)"
      );
    });
  });

  describe("checkNewDueDateIsAtLeastCurrentDueDate", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      dueDate: new Date(2026, 11, 13, 4, 59, 59, 999),
    };

    it("should return undefined if the new date is equal to the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(testDeliverable.dueDate!);

      const result = checkNewDueDateIsAtLeastCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBeUndefined();
    });

    it("should return undefined if the new date is greater than the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2026, 11, 14, 4, 59, 59, 999)
      );

      const result = checkNewDueDateIsAtLeastCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBeUndefined();
    });

    it("should return an appropriate error message if the new due date is less than the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2026, 11, 12, 4, 59, 59, 999)
      );

      const result = checkNewDueDateIsAtLeastCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBe(
        "Newly requested due date cannot be less than the original due date; " +
          "requested Fri Dec 11 2026 23:59:59 GMT-0500 (Eastern Standard Time)."
      );
    });
  });

  describe("checkNewDueDateIsGreaterThanCurrentDueDate", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      dueDate: new Date(2026, 11, 13, 4, 59, 59, 999),
    };

    it("should return undefined if the new date is greater than the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2026, 11, 14, 4, 59, 59, 999)
      );

      const result = checkNewDueDateIsGreaterThanCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBeUndefined();
    });

    it("should return an appropriate error message if the new due date is less than the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2026, 11, 12, 4, 59, 59, 999)
      );

      const result = checkNewDueDateIsGreaterThanCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBe(
        "Newly requested due date cannot be less than or equal to the original due date; " +
          "requested Fri Dec 11 2026 23:59:59 GMT-0500 (Eastern Standard Time)."
      );
    });

    it("should return an appropriate error message if the new due date is equal to the current due date", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2026, 11, 13, 4, 59, 59, 999)
      );

      const result = checkNewDueDateIsGreaterThanCurrentDueDate(
        testDeliverable as PrismaDeliverable,
        testInput
      );
      expect(result).toBe(
        "Newly requested due date cannot be less than or equal to the original due date; " +
          "requested Sat Dec 12 2026 23:59:59 GMT-0500 (Eastern Standard Time)."
      );
    });
  });

  describe("checkDeliverableHasAtLeastOneDocument", () => {
    const testTransaction = "I'm a test transaction!" as any;
    const testDeliverableId = "72c01127-bf42-4b9f-a902-1a237ecdf7b7";
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
    };

    const mockDocumentList: Partial<PrismaDocument>[] = [
      { id: "document1", deliverableId: testDeliverableId },
      { id: "document2", deliverableId: testDeliverableId },
    ];

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should return undefined if there is at least one document", async () => {
      vi.mocked(selectManyDocuments).mockResolvedValue(mockDocumentList as PrismaDocument[]);

      const result = await checkDeliverableHasAtLeastOneDocument(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBeUndefined();
      expect(selectManyDocuments).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableId,
          deliverableIsCmsAttachedFile: false,
        },
        testTransaction
      );
    });

    it("should return an error message if there are no documents returned", async () => {
      vi.mocked(selectManyDocuments).mockResolvedValue([] as PrismaDocument[]);

      const result = await checkDeliverableHasAtLeastOneDocument(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Cannot submit deliverable ${testDeliverableId} because it has no state documents attached.`
      );
    });
  });

  describe("checkDeliverableHasNoActiveExtension", () => {
    const testTransaction = "I'm a test transaction!" as any;
    const testDeliverableId = "72c01127-bf42-4b9f-a902-1a237ecdf7b7";
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: testDeliverableId,
    };

    const mockDeliverableExtensionList: Partial<PrismaDeliverableExtension>[] = [
      { id: "extension1", deliverableId: "someId" },
      { id: "extension2", deliverableId: "anotherId" },
    ];

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("should return undefined if no extension is returned", async () => {
      vi.mocked(selectManyDeliverableExtensions).mockResolvedValue([]);

      const result = await checkDeliverableHasNoActiveExtension(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBeUndefined();
      expect(selectManyDeliverableExtensions).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableId,
          statusId: "Requested",
        },
        testTransaction
      );
    });

    it("should return an error message if an extension is returned", async () => {
      vi.mocked(selectManyDeliverableExtensions).mockResolvedValue(
        mockDeliverableExtensionList as PrismaDeliverableExtension[]
      );

      const result = await checkDeliverableHasNoActiveExtension(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Cannot create new extension request for deliverable ${testDeliverableId} ` +
          "as there is already an open request."
      );
    });
  });

  describe("checkDeliverableExtensionHasStatus", () => {
    const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
      id: "1e42da3a-9355-4c5d-a541-812a9f95ef56",
      statusId: "Denied" satisfies DeliverableExtensionStatus,
    };

    it("should return undefined if the passed status matches the object", () => {
      const result = checkDeliverableExtensionHasStatus(
        testDeliverableExtension as PrismaDeliverableExtension,
        ["Denied"]
      );
      expect(result).toBeUndefined();
    });

    it("should return an error message the passed status does not match the object", () => {
      const result = checkDeliverableExtensionHasStatus(
        testDeliverableExtension as PrismaDeliverableExtension,
        ["Approved", "Requested"]
      );
      expect(result).toBe(
        "Deliverable extension expected to have one of status Approved, Requested; " +
          "actual status was Denied."
      );
    });
  });

  describe("checkDeliverableHasNoDocuments", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "3d802d02-f464-44e0-b789-53a9aa249979",
      statusId: "Upcoming" satisfies DeliverableStatus,
    };
    const testTransaction = "I'm a test transaction!" as any;

    it("should return undefined if no documents are returned", async () => {
      vi.mocked(selectManyDocuments).mockResolvedValue([]);

      const result = await checkDeliverableHasNoDocuments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBeUndefined();
    });

    it("should return an error message if documents are returned", async () => {
      vi.mocked(selectManyDocuments).mockResolvedValue([{ id: "abc123" }] as PrismaDocument[]);

      const result = await checkDeliverableHasNoDocuments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Expected deliverable ${testDeliverable.id} to have no ` +
          "documents attached, but documents were found."
      );
    });
  });

  describe("checkDeliverableHasNoComments", () => {
    const testDeliverable: Partial<PrismaDeliverable> = {
      id: "45f7753b-9d83-425c-9274-dad2cf5d551e",
      statusId: "Past Due" satisfies DeliverableStatus,
    };
    const testTransaction = "I'm a test transaction!" as any;

    it("should return undefined if no comments are returned", async () => {
      vi.mocked(selectManyPublicComments).mockResolvedValue([]);
      vi.mocked(selectManyPrivateComments).mockResolvedValue([]);

      const result = await checkDeliverableHasNoComments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBeUndefined();
    });

    it("should return an error message if private comments are found", async () => {
      vi.mocked(selectManyPublicComments).mockResolvedValue([]);
      vi.mocked(selectManyPrivateComments).mockResolvedValue([
        { id: "abc123" },
      ] as PrismaPrivateComment[]);

      const result = await checkDeliverableHasNoComments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Expected deliverable ${testDeliverable.id} to have no ` +
          "comments, but public or private comments were found."
      );
    });

    it("should return an error message if public comments are found", async () => {
      vi.mocked(selectManyPublicComments).mockResolvedValue([
        { id: "abc123" },
      ] as PrismaPrivateComment[]);
      vi.mocked(selectManyPrivateComments).mockResolvedValue([]);

      const result = await checkDeliverableHasNoComments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Expected deliverable ${testDeliverable.id} to have no ` +
          "comments, but public or private comments were found."
      );
    });

    it("should return an error message if both type of comments are found", async () => {
      vi.mocked(selectManyPublicComments).mockResolvedValue([
        { id: "abc123" },
      ] as PrismaPrivateComment[]);
      vi.mocked(selectManyPrivateComments).mockResolvedValue([
        { id: "def456" },
      ] as PrismaPrivateComment[]);

      const result = await checkDeliverableHasNoComments(
        testDeliverable as PrismaDeliverable,
        testTransaction
      );
      expect(result).toBe(
        `Expected deliverable ${testDeliverable.id} to have no ` +
          "comments, but public or private comments were found."
      );
    });
  });

  describe("checkRequiredDeliverableDemonstrationTypes", () => {
    it("should return undefined if a required deliverable type has demonstration types", () => {
      const result = checkRequiredDeliverableDemonstrationTypes(
        "Implementation Plan",
        new Set(["Free Insulin"])
      );

      expect(result).toBeUndefined();
    });

    it("should return an error string if a required deliverable type has no demonstration types", () => {
      const result = checkRequiredDeliverableDemonstrationTypes(
        "Implementation Plan",
        undefined
      );

      expect(result).toBe(
        "Deliverable type Implementation Plan requires at least one demonstration type"
      );
    });

    it("should return undefined if the deliverable type does not require demonstration types", () => {
      const result = checkRequiredDeliverableDemonstrationTypes(
        "Evaluation Design",
        undefined
      );

      expect(result).toBeUndefined();
    });
  });
});
