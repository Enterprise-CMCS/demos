import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectExtension } from "./selectExtension";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectExtension", () => {
  const extensionFindAtMostOne = vi.fn();

  const mockPrismaClient = {
    extension: {
      findAtMostOne: extensionFindAtMostOne,
    },
  };

  const mockTransaction = {
    extension: {
      findAtMostOne: vi.fn(),
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
    extensionFindAtMostOne.mockResolvedValueOnce(extension);

    const result = await selectExtension(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(extensionFindAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extension);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const extension = { id: "extension-1" } as PrismaExtension;
    mockTransaction.extension.findAtMostOne = vi.fn().mockResolvedValueOnce(extension);

    const result = await selectExtension(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.extension.findAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(extension);
  });

  it("returns null when no extension is found", async () => {
    extensionFindAtMostOne.mockResolvedValueOnce(null);

    const result = await selectExtension(where);

    expect(result).toBeNull();
  });
});
