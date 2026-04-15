// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { TagName } from "../../types.js";
import {
  Deliverable as PrismaDeliverable,
  DeliverableDemonstrationType as PrismaDeliverableDemonstrationType,
} from "@prisma/client";

// Functions under test
import { updateDeliverableDemonstrationTypes } from "./updateDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../deliverableDemonstrationType", () => ({
  getDeliverableDemonstrationTypes: vi.fn(),
  setDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock(".", () => ({
  getDeliverable: vi.fn(),
}));

import {
  getDeliverableDemonstrationTypes,
  setDeliverableDemonstrationTypes,
} from "../deliverableDemonstrationType";
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
  const mockDeliverableDemonstrationTypes: PrismaDeliverableDemonstrationType[] = [
    {
      deliverableId: testDeliverableId,
      demonstrationId: mockDemonstrationId,
      demonstrationTypeTagNameId: "Free Insulin",
    },
    {
      deliverableId: testDeliverableId,
      demonstrationId: mockDemonstrationId,
      demonstrationTypeTagNameId: "Low Cost Vitamin A Supplements for Newborns",
    },
  ];

  // Mock transaction
  const mockTransaction: any = "Test!";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDeliverable).mockResolvedValue(mockDeliverable as PrismaDeliverable);
    vi.mocked(getDeliverableDemonstrationTypes).mockResolvedValue(
      mockDeliverableDemonstrationTypes
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
    expect(getDeliverableDemonstrationTypes).not.toHaveBeenCalled();
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
    expect(getDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
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
    expect(getDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
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
    expect(getDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testDeliverableId,
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
});
