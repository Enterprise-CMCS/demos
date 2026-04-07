import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAmendment } from "./queryAmendment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryAmendment", () => {
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
    const amendment = { id: "amendment-1" } as PrismaAmendment;
    amendmentFindMany.mockResolvedValueOnce([amendment]);

    const result = await queryAmendment(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(amendmentFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendment);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const amendment = { id: "amendment-1" } as PrismaAmendment;
    mockTransaction.amendment.findMany = vi.fn().mockResolvedValueOnce([amendment]);

    const result = await queryAmendment(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.amendment.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendment);
  });

  it("returns null when no amendments are found", async () => {
    amendmentFindMany.mockResolvedValueOnce([]);

    const result = await queryAmendment(where);

    expect(result).toBeNull();
  });

  it("returns the amendment when exactly one amendment is found", async () => {
    const amendment = { id: "amendment-1" } as PrismaAmendment;
    amendmentFindMany.mockResolvedValueOnce([amendment]);

    const result = await queryAmendment(where);

    expect(result).toBe(amendment);
  });

  it("throws when more than one amendment is found", async () => {
    amendmentFindMany.mockResolvedValueOnce([
      { id: "amendment-1" } as PrismaAmendment,
      { id: "amendment-2" } as PrismaAmendment,
    ]);

    await expect(queryAmendment(where)).rejects.toThrow(
      "Expected to find at most one Amendment, but found 2"
    );
  });
});
