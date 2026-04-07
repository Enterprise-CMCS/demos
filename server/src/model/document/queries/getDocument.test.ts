import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDocument } from "./getDocument";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getDocument", () => {
  const regularMocks = {
    document: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    document: {
      findUniqueOrThrow: regularMocks.document.findUniqueOrThrow,
    },
  };
  const transactionMocks = {
    document: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findUniqueOrThrow: transactionMocks.document.findUniqueOrThrow,
    },
  } as any;
  const testDocumentId = "c8697763-fdd8-4502-b538-9e3cde153b05";
  const expectedCall = {
    where: { id: testDocumentId },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should get the document directly from the database directly if no transaction is given", async () => {
    await getDocument({ id: testDocumentId });
    expect(regularMocks.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.document.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("should get the document via a transaction if one is given", async () => {
    await getDocument({ id: testDocumentId }, mockTransaction);
    expect(regularMocks.document.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.document.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
