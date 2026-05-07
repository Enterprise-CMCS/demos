// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import {
  DeliverableAction as PrismaDeliverableAction,
  DeliverableExtension as PrismaDeliverableExtension,
} from "@prisma/client";
import { DeliverableExtensionReasonCode, DeliverableExtensionStatus } from "../../types";

// Functions under test
import { deliverableExtensionResolvers } from "./deliverableExtensionResolvers";

// Mock imports
vi.mock("../deliverableAction/queries", () => ({
  selectDeliverableAction: vi.fn(),
}));

import { selectDeliverableAction } from "../deliverableAction/queries";

describe("deliverableExtensionResolvers", () => {
  const testDeliverableExtension: Partial<PrismaDeliverableExtension> = {
    statusId: "Requested" satisfies DeliverableExtensionStatus,
    reasonCodeId: "COVID-19" satisfies DeliverableExtensionReasonCode,
  };

  const mockDeliverableAction: Partial<PrismaDeliverableAction> = {
    note: "This is a note",
    oldDueDate: new Date(2027, 0, 1, 19, 13, 23, 449),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(selectDeliverableAction).mockResolvedValue(
      mockDeliverableAction as PrismaDeliverableAction
    );
  });

  describe("DeliverableExtension.status", () => {
    it("returns the status of the deliverable extension request", async () => {
      const result = deliverableExtensionResolvers.DeliverableExtension.status(
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(result).toBe("Requested");
    });
  });

  describe("DeliverableExtension.reasonCode", () => {
    it("returns the reason code of the deliverable extension request", async () => {
      const result = deliverableExtensionResolvers.DeliverableExtension.reasonCode(
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(result).toBe("COVID-19");
    });
  });

  describe("DeliverableExtension.reasonDetails", async () => {
    it("queries the right record from action and returns the value", async () => {
      const result = await deliverableExtensionResolvers.DeliverableExtension.reasonDetails(
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(selectDeliverableAction).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableExtension.deliverableId,
          activeExtensionId: testDeliverableExtension.id,
          actionTypeId: "Requested Extension",
        },
        true
      );
      expect(result).toBe(mockDeliverableAction.note);
    });
  });

  describe("DeliverableExtension.initialDueDateAtRequest", async () => {
    it("queries the right record from action and returns the value", async () => {
      const result =
        await deliverableExtensionResolvers.DeliverableExtension.initialDueDateAtRequest(
          testDeliverableExtension as PrismaDeliverableExtension
        );
      expect(selectDeliverableAction).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableExtension.deliverableId,
          activeExtensionId: testDeliverableExtension.id,
          actionTypeId: "Requested Extension",
        },
        true
      );
      expect(result).toBe(mockDeliverableAction.oldDueDate);
    });
  });

  describe("DeliverableExtension.denialDetails", async () => {
    it("queries the right record from action and returns the value", async () => {
      const result = await deliverableExtensionResolvers.DeliverableExtension.denialDetails(
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(selectDeliverableAction).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableExtension.deliverableId,
          activeExtensionId: testDeliverableExtension.id,
          actionTypeId: "Denied Extension Request",
        },
        false
      );
      expect(result).toBe(mockDeliverableAction.note);
    });

    it("returns null if nothing is returned by the query", async () => {
      vi.mocked(selectDeliverableAction).mockResolvedValue(null);
      const result = await deliverableExtensionResolvers.DeliverableExtension.denialDetails(
        testDeliverableExtension as PrismaDeliverableExtension
      );
      expect(selectDeliverableAction).toHaveBeenCalledExactlyOnceWith(
        {
          deliverableId: testDeliverableExtension.deliverableId,
          activeExtensionId: testDeliverableExtension.id,
          actionTypeId: "Denied Extension Request",
        },
        false
      );
      expect(result).toBe(null);
    });
  });
});
