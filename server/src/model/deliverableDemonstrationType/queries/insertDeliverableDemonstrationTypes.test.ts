// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import { SetDeliverableDemonstrationTypesInput } from "..";

// Functions under test
import { insertDeliverableDemonstrationTypes } from "./insertDeliverableDemonstrationTypes";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../deliverable", () => ({
  getDeliverable: vi.fn(),
}));

import { prisma } from "../../../prismaClient";
import { getDeliverable } from "../../deliverable";

describe("insertDeliverableDemonstrationTypes", () => {
  // Test inputs
  const baseTestInput: Partial<SetDeliverableDemonstrationTypesInput> = {
    deliverableId: "8c1bb42f-e3b7-40e8-b3c3-027934c0cbc0",
    demonstrationId: "a8703c37-2c58-4ed6-9338-261a4604d8da",
  };
  const regularTestInput = {
    ...baseTestInput,
    demonstrationTypes: ["Low Cost Blood Pressure Screenings", "Mental Health Advocacy"],
  } as SetDeliverableDemonstrationTypesInput;
  const emptyTestInput = {
    ...baseTestInput,
    demonstrationTypes: [],
  } as SetDeliverableDemonstrationTypesInput;

  // Expected calls
  const expectedRegularCall = {
    data: [
      {
        deliverableId: regularTestInput.deliverableId,
        demonstrationId: regularTestInput.demonstrationId,
        demonstrationTypeTagNameId: regularTestInput.demonstrationTypes[0],
      },
      {
        deliverableId: regularTestInput.deliverableId,
        demonstrationId: regularTestInput.demonstrationId,
        demonstrationTypeTagNameId: regularTestInput.demonstrationTypes[1],
      },
    ],
  };

  // Mock clients
  const regularMocks = {
    deliverableDemonstrationType: {
      createMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverableDemonstrationType: {
      createMany: regularMocks.deliverableDemonstrationType.createMany,
    },
  };

  const transactionMocks = {
    deliverableDemonstrationType: {
      createMany: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverableDemonstrationType: {
      createMany: transactionMocks.deliverableDemonstrationType.createMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert the new deliverable demonstration type records using a new client if no transaction is given", async () => {
    await insertDeliverableDemonstrationTypes(regularTestInput);
    expect(regularMocks.deliverableDemonstrationType.createMany).toHaveBeenCalledExactlyOnceWith(
      expectedRegularCall
    );
    expect(transactionMocks.deliverableDemonstrationType.createMany).not.toHaveBeenCalled();
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: regularTestInput.deliverableId },
      mockPrismaClient
    );
  });

  it("should insert the new deliverable demonstration type records using a transaction if one is given", async () => {
    await insertDeliverableDemonstrationTypes(regularTestInput, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.createMany).not.toHaveBeenCalled();
    expect(
      transactionMocks.deliverableDemonstrationType.createMany
    ).toHaveBeenCalledExactlyOnceWith(expectedRegularCall);
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: regularTestInput.deliverableId },
      mockTransaction
    );
  });

  it("should skip inserting if no values are given", async () => {
    await insertDeliverableDemonstrationTypes(emptyTestInput, mockTransaction);
    expect(regularMocks.deliverableDemonstrationType.createMany).not.toHaveBeenCalled();
    expect(transactionMocks.deliverableDemonstrationType.createMany).not.toHaveBeenCalled();
    expect(getDeliverable).toHaveBeenCalledExactlyOnceWith(
      { id: emptyTestInput.deliverableId },
      mockTransaction
    );
  });
});
