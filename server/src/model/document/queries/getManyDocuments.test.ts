import { describe, it, expect, vi, beforeEach } from "vitest";
import { getManyDocuments } from "./getManyDocuments";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getManyDocuments", () => {
  const regularMocks = {
    document: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findMany: regularMocks.document.findMany,
    },
  };
  const transactionMocks = {
    document: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findMany: transactionMocks.document.findMany,
    },
  } as any;
  const testApplicationId = "7cc7f95d-cf7d-477b-acd7-ebae7109a631";
  const expectedCall = {
    where: { applicationId: testApplicationId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should not filter if nothing is passed to the function", async () => {
    await getManyDocuments();
    expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith({ where: {} });
    expect(transactionMocks.document.findMany).not.toHaveBeenCalled();
  });

  it("should use a transaction if it is passed, even if not filtering", async () => {
    await getManyDocuments({}, mockTransaction);
    expect(regularMocks.document.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.document.findMany).toHaveBeenCalledExactlyOnceWith({ where: {} });
  });

  it("should get the documents directly from the database directly if no transaction is given", async () => {
    await getManyDocuments({ applicationId: testApplicationId });
    expect(regularMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.document.findMany).not.toHaveBeenCalled();
  });

  it("should get the documents via a transaction if one is given", async () => {
    await getManyDocuments({ applicationId: testApplicationId }, mockTransaction);
    expect(regularMocks.document.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});
