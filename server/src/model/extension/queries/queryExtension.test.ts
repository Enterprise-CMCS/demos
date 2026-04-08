import { Extension as PrismaExtension } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";
import { queryExtension } from "./queryExtension";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../../prismaUtilities/queryAtMostOne", () => ({
  queryAtMostOne: vi.fn(),
}));

describe("queryExtension", () => {
  const mockPrismaClient = {
    extension: {},
  };

  const mockTransaction = {
    extension: {},
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
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(extension);

    const result = await queryExtension(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockPrismaClient.extension, where);
    expect(result).toBe(extension);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const extension = { id: "extension-1" } as PrismaExtension;
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(extension);

    const result = await queryExtension(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockTransaction.extension, where);
    expect(result).toBe(extension);
  });

  it("returns null when queryAtMostOne returns null", async () => {
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(null);

    const result = await queryExtension(where);

    expect(result).toBeNull();
  });
});
