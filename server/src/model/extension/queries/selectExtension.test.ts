import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectExtension } from "./selectExtension";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectExtension", () => {
  const regularMocks = {
    extension: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockPrismaClient = {
    extension: {
      findAtMostOne: regularMocks.extension.findAtMostOne,
    },
  };
  const transactionMocks = {
    extension: {
      findAtMostOne: vi.fn(),
    },
  };
  const mockTransaction = {
    extension: {
      findAtMostOne: transactionMocks.extension.findAtMostOne,
    },
  } as any;

  const testExtensionId = "extension-1";
  const where = {
    id: testExtensionId,
  };
  const expectedCall = {
    where: { id: testExtensionId },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should get extension from the database directly if no transaction is given", async () => {
    await selectExtension(where);
    expect(regularMocks.extension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.extension.findAtMostOne).not.toHaveBeenCalled();
  });

  it("should get extension via a transaction if one is given", async () => {
    await selectExtension(where, mockTransaction);
    expect(regularMocks.extension.findAtMostOne).not.toHaveBeenCalled();
    expect(transactionMocks.extension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns null when no extension is found", async () => {
    regularMocks.extension.findAtMostOne.mockResolvedValueOnce(null);
    const result = await selectExtension(where);
    expect(regularMocks.extension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBeNull();
  });

  it("returns extension that is found", async () => {
    const extension = { id: testExtensionId } as PrismaExtension;
    regularMocks.extension.findAtMostOne.mockResolvedValueOnce(extension);

    const result = await selectExtension(where);
    expect(regularMocks.extension.findAtMostOne).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(extension);
  });
});
