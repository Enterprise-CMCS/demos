import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryManyAmendments } from "./queryManyAmendments";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryManyAmendments", () => {
  const amendmentFindMany = vi.fn();

  const mockPrismaClient = {
    amendment: {
      findMany: amendmentFindMany,
    },
  };

  const mockTransaction = {
    amendment: {
      findMany: vi.fn(),
    },
  } as unknown as PrismaTransactionClient;

  const where = {
    id: "amendment-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("uses the default prisma client when no transaction client is provided", async () => {
    const amendments = [{ id: "amendment-1" }, { id: "amendment-2" }] as PrismaAmendment[];
    amendmentFindMany.mockResolvedValueOnce(amendments);

    const result = await queryManyAmendments(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(amendmentFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendments);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const amendments = [{ id: "amendment-1" }, { id: "amendment-2" }] as PrismaAmendment[];
    mockTransaction.amendment.findMany = vi.fn().mockResolvedValueOnce(amendments);

    const result = await queryManyAmendments(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.amendment.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendments);
  });

  it("returns an empty array when no amendments are found", async () => {
    amendmentFindMany.mockResolvedValueOnce([]);

    const result = await queryManyAmendments(where);

    expect(result).toEqual([]);
  });

  it("returns all amendments that are found", async () => {
    const amendments = [{ id: "amendment-1" }, { id: "amendment-2" }] as PrismaAmendment[];
    amendmentFindMany.mockResolvedValueOnce(amendments);

    const result = await queryManyAmendments(where);

    expect(result).toBe(amendments);
  });
});
