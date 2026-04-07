import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryExtension } from "./queryExtension";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryExtension", () => {
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
    const extension = { id: "extension-1" } as PrismaExtension;
    extensionFindMany.mockResolvedValueOnce([extension]);

    const result = await queryExtension(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(extensionFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extension);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const extension = { id: "extension-1" } as PrismaExtension;
    mockTransaction.extension.findMany = vi.fn().mockResolvedValueOnce([extension]);

    const result = await queryExtension(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.extension.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extension);
  });

  it("returns null when no extensions are found", async () => {
    extensionFindMany.mockResolvedValueOnce([]);

    const result = await queryExtension(where);

    expect(result).toBeNull();
  });

  it("returns the extension when exactly one extension is found", async () => {
    const extension = { id: "extension-1" } as PrismaExtension;
    extensionFindMany.mockResolvedValueOnce([extension]);

    const result = await queryExtension(where);

    expect(result).toBe(extension);
  });

  it("throws when more than one extension is found", async () => {
    extensionFindMany.mockResolvedValueOnce([
      { id: "extension-1" } as PrismaExtension,
      { id: "extension-2" } as PrismaExtension,
    ]);

    await expect(queryExtension(where)).rejects.toThrow(
      "Expected to find at most one Extension, but found 2"
    );
  });
});
