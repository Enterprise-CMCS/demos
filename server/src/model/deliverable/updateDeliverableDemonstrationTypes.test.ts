// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { TagName, TagStatus } from "../../types";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { DeliverableDemonstrationTypeQueryResult } from "../deliverableDemonstrationType/queries";

// Functions under test
import { updateDeliverableDemonstrationTypes } from "./updateDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../deliverableDemonstrationType", () => ({
  setDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverableDemonstrationType/queries", () => ({
  selectManyDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock(".", () => ({
  getDeliverable: vi.fn(),
}));

import { setDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";
import { selectManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType/queries";
import { getDeliverable } from ".";

describe("updateDeliverableDemonstrationTypes", () => {
  // Test inputs
  const testDeliverableId = "03cb9763-1dea-4a40-a449-dc9fbc969c50";

  // Mock results
  const mockDemonstrationId = "6ba5407b-3706-4795-b8a8-3e32e8fa77ac";
  const mockDeliverable: Partial<PrismaDeliverable> = {
    id: testDeliverableId,
    demonstrationId: mockDemonstrationId,
  };
  const mockDeliverableDemonstrationTypes: DeepPartial<DeliverableDemonstrationTypeQueryResult>[] =
    [
      {
        deliverableId: testDeliverableId,
        demonstrationId: mockDemonstrationId,
        demonstrationTypeTagAssignment: {
          tagNameId: "Free Insulin",
          tag: {
            tagNameId: "Free Insulin",
            statusId: "Approved" satisfies TagStatus,
          },
        },
      },
      {
        deliverableId: testDeliverableId,
        demonstrationId: mockDemonstrationId,
        demonstrationTypeTagAssignment: {
          tagNameId: "Low Cost Vitamin A Supplements for Newborns",
          tag: {
            tagNameId: "Low Cost Vitamin A Supplements for Newborns",
            statusId: "Unapproved" satisfies TagStatus,
          },
        },
      },
    ];

  // Mock transaction
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValue(
      mockDeliverableDemonstrationTypes as DeliverableDemonstrationTypeQueryResult[]
    );
  });

  it("should do nothing if the test input has no demonstration types", async () => {
    const testInput = {
      name: "A deliverable!",
    };

    const result = await updateDeliverableDemonstrationTypes(
      testDeliverableId,
      testInput,
      mockTransaction
    );
    expect(result).toBeUndefined();
    expect(getDeliverable).not.toHaveBeenCalled();
    expect(selectManyDeliverableDemonstrationTypes).not.toHaveBeenCalled();
    expect(setDeliverableDemonstrationTypes).not.toHaveBeenCalled();
  });

  it("should still process if the demonstration types are an empty set", async () => {
    const testInput = {
      name: "A deliverable!",
      demonstrationTypes: new Set<TagName>(),
    };

    await updateDeliverableDemonstrationTypes(testDeliverableId, testInput, mockTransaction);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        demonstrationId: mockDemonstrationId,
        demonstrationTypes: [],
      },
      mockTransaction
    );
  });

  it("should make no changes if the inputs match the current demonstration types", async () => {
    const testInput = {
      name: "A deliverable!",
      demonstrationTypes: new Set(["Free Insulin", "Low Cost Vitamin A Supplements for Newborns"]),
    };

    await updateDeliverableDemonstrationTypes(testDeliverableId, testInput, mockTransaction);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).not.toHaveBeenCalled();
  });

  it("should make changes if the inputs do not match the current demonstration types", async () => {
    const testInput = {
      name: "A deliverable!",
      demonstrationTypes: new Set(["Free Insulin"]),
    };

    await updateDeliverableDemonstrationTypes(testDeliverableId, testInput, mockTransaction);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        demonstrationId: mockDemonstrationId,
        demonstrationTypes: ["Free Insulin"],
      },
      mockTransaction
    );
  });

  it("should treat empty demonstration types as a valid input to pass", async () => {
    const testInput = {
      name: "A deliverable!",
      demonstrationTypes: new Set<TagName>(),
    };

    await updateDeliverableDemonstrationTypes(testDeliverableId, testInput, mockTransaction);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: testDeliverableId },
      mockTransaction
    );
    expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockTransaction
    );
    expect(setDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testDeliverableId,
        demonstrationId: mockDemonstrationId,
        demonstrationTypes: [],
      },
      mockTransaction
    );
  });
});
