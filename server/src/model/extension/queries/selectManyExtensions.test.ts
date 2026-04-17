import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyExtensions } from "./selectManyExtensions";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyExtensions", () => {
  const regularMocks = {
    extension: {
      findMany: vi.fn(),
    },
  };
  const mockPrismaClient = {
    extension: {
      findMany: regularMocks.extension.findMany,
    },
  };
  const transactionMocks = {
    extension: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    extension: {
      findMany: transactionMocks.extension.findMany,
    },
  } as any;

  const testExtensionId = "extension-1";
  const testExtensionId2 = "extension-2";
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

  it("should get extensions from the database directly if no transaction is given", async () => {
    await selectManyExtensions(where);
    expect(regularMocks.extension.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.extension.findMany).not.toHaveBeenCalled();
  });

  it("should get extensions via a transaction if one is given", async () => {
    await selectManyExtensions(where, mockTransaction);
    expect(regularMocks.extension.findMany).not.toHaveBeenCalled();
    expect(transactionMocks.extension.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });

  it("returns an empty array when no extensions are found", async () => {
    regularMocks.extension.findMany.mockResolvedValueOnce([]);
    const result = await selectManyExtensions(where);
    expect(regularMocks.extension.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toEqual([]);
  });

  it("returns all extensions that are found", async () => {
    const extensions = [{ id: testExtensionId }, { id: testExtensionId2 }] as PrismaExtension[];
    regularMocks.extension.findMany.mockResolvedValueOnce(extensions);

    const result = await selectManyExtensions(where);
    expect(regularMocks.extension.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(result).toBe(extensions);
  });
});
