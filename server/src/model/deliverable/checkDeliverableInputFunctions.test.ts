// Vitest and other helpers
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EasternTZDate, parseJSDateToEasternTZDate } from "../../dateUtilities";

// Types
import { ApplicationStatus, DeliverableStatus, Document, PersonType, TagName } from "../../types";
import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  Document as PrismaDocument,
  User as PrismaUser,
} from "@prisma/client";

// Functions under test
import {
  checkDemonstrationStatus,
  checkDeliverableStatusNotFinalized,
  checkForDuplicateDemonstrationTypes,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  checkDueDateInFuture,
  checkDeliverableHasAtLeastOneDocument,
} from "./checkDeliverableInputFunctions";

// Mock imports
vi.mock("../document", () => ({
  selectManyDocuments: vi.fn(),
}));

import { selectManyDocuments } from "../document";

describe("checkDeliverableInputFunctions", () => {
  describe("checkDemonstrationStatus", () => {
    it("should return undefined if the demonstration is Approved", () => {
      const testInput: Partial<PrismaDemonstration> = {
        id: "abc123",
        statusId: "Approved" satisfies ApplicationStatus,
      };
      const result = checkDemonstrationStatus(testInput as PrismaDemonstration);
      expect(result).toBeUndefined();
    });

    it("should return an error string if the demonstration is not Approved", () => {
      const testInput: Partial<PrismaDemonstration> = {
        id: "abc123",
        statusId: "Under Review" satisfies ApplicationStatus,
      };
      const result = checkDemonstrationStatus(testInput as PrismaDemonstration);
      expect(result).toBe(
        "Demonstration abc123 is not in Approved status; cannot create deliverable."
      );
    });
  });

  describe("checkDeliverableStatusNotFinalized", () => {
    const checkDeliverableStatusInputs: [
      DeliverableStatus,
      Partial<PrismaDeliverable>,
      string | undefined,
    ][] = [
      [
        "Upcoming",
        {
          id: "abc123",
          statusId: "Upcoming",
        },
        undefined,
      ],
      [
        "Past Due",
        {
          id: "abc123",
          statusId: "Past Due",
        },
        undefined,
      ],
      [
        "Submitted",
        {
          id: "abc123",
          statusId: "Submitted",
        },
        undefined,
      ],
      [
        "Under CMS Review",
        {
          id: "abc123",
          statusId: "Under CMS Review",
        },
        undefined,
      ],
      [
        "Accepted",
        {
          id: "abc123",
          statusId: "Accepted",
        },
        "Cannot submit or modify deliverable abc123 as it has already been finalized.",
      ],
      [
        "Approved",
        {
          id: "abc123",
          statusId: "Approved",
        },
        "Cannot submit or modify deliverable abc123 as it has already been finalized.",
      ],
      [
        "Received and Filed",
        {
          id: "abc123",
          statusId: "Received and Filed",
        },
        "Cannot submit or modify deliverable abc123 as it has already been finalized.",
      ],
    ];
    it.each(checkDeliverableStatusInputs)(
      "properly checks the status (%s)",
      (deliverableStatus, testDeliverable, expectedResult) => {
        const result = checkDeliverableStatusNotFinalized(testDeliverable as PrismaDeliverable);
        expect(result).toBe(expectedResult);
      }
    );
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

    it("should return an appropriate error message if the eue date is in the past", () => {
      const testInput: EasternTZDate = parseJSDateToEasternTZDate(
        new Date(2023, 8, 17, 3, 22, 11, 13)
      );

      const result = checkDueDateInFuture(testInput);
      expect(result).toBe(
        "Cannot request a due date in the past; requested Sat Sep 16 2023 23:22:11 GMT-0400 (Eastern Daylight Time)"
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
});
