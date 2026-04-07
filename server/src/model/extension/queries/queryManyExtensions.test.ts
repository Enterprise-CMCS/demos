import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryManyExtensions } from "./queryManyExtensions";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryManyExtensions", () => {
  const extensionFindMany = vi.fn();

  const mockPrismaClient = {
    extension: {
      findMany: extensionFindMany,
    },
  };

  const mockTransaction = {
    extension: {
      findMany: vi.fn(),
    },
  } as unknown as PrismaTransactionClient;

  const where = {
    id: "extension-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("uses the default prisma client when no transaction client is provided", async () => {
    const extensions = [{ id: "extension-1" }, { id: "extension-2" }] as PrismaExtension[];
    extensionFindMany.mockResolvedValueOnce(extensions);

    const result = await queryManyExtensions(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(extensionFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extensions);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const extensions = [{ id: "extension-1" }, { id: "extension-2" }] as PrismaExtension[];
    mockTransaction.extension.findMany = vi.fn().mockResolvedValueOnce(extensions);

    const result = await queryManyExtensions(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.extension.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extensions);
  });

  it("returns an empty array when no extensions are found", async () => {
    extensionFindMany.mockResolvedValueOnce([]);

    const result = await queryManyExtensions(where);

    expect(result).toEqual([]);
  });

  it("returns all extensions that are found", async () => {
    const extensions = [{ id: "extension-1" }, { id: "extension-2" }] as PrismaExtension[];
    extensionFindMany.mockResolvedValueOnce(extensions);

    const result = await queryManyExtensions(where);

    expect(result).toBe(extensions);
  });
});
