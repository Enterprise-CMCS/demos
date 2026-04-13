// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { SetDeliverableDemonstrationTypesInput } from "../../types";

// Functions under test
import { setDeliverableDemonstrationTypes } from "./setDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  deleteAllDeliverableDemonstrationTypes: vi.fn(),
  insertDeliverableDemonstrationTypes: vi.fn(),
}));

vi.mock("../deliverable", () => ({
  getDeliverable: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { deleteAllDeliverableDemonstrationTypes, insertDeliverableDemonstrationTypes } from ".";
import { getDeliverable } from "../deliverable";

describe("setDeliverableDemonstrationTypes", () => {
  const mockPrismaClient: any = "Test return client!";
  const mockTransaction: any = "Test transaction!";
  const testInput: SetDeliverableDemonstrationTypesInput = {
    deliverableId: "8c9f8296-65b5-4836-b3b1-55f736e38e30",
    demonstrationId: "17804c84-972b-4083-868c-c7c95e596aa0",
    demonstrationTypes: ["Free Band-Aids", "Low-Cost Vaccination Program"],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should delete, insert, and then get the deliverable in cases where a client is provided", async () => {
    await setDeliverableDemonstrationTypes(testInput, mockTransaction);

    expect(deleteAllDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testInput.deliverableId,
      },
      mockTransaction
    );
    expect(insertDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testInput,
      mockTransaction
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      {
        id: testInput.deliverableId,
      },
      mockTransaction
    );
  });

  it("should generate a client and then delete, insert, and then get the deliverable if no client is provided", async () => {
    await setDeliverableDemonstrationTypes(testInput);

    expect(deleteAllDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      {
        deliverableId: testInput.deliverableId,
      },
      mockPrismaClient
    );
    expect(insertDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
      testInput,
      mockPrismaClient
    );
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      {
        id: testInput.deliverableId,
      },
      mockPrismaClient
    );
  });
});
