import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAmendment } from "./queryAmendment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryAmendment", () => {
  const amendmentFindAtMostOne = vi.fn();

  const mockPrismaClient = {
    amendment: {
      findAtMostOne: amendmentFindAtMostOne,
    },
  };

  const mockTransaction = {
    amendment: {
      findAtMostOne: vi.fn(),
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
    amendmentFindAtMostOne.mockResolvedValueOnce(amendment);

    const result = await queryAmendment(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(amendmentFindAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendment);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const amendment = { id: "amendment-1" } as PrismaAmendment;
    mockTransaction.amendment.findAtMostOne = vi.fn().mockResolvedValueOnce(amendment);

    const result = await queryAmendment(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.amendment.findAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(amendment);
  });

  it("returns null when no amendment is found", async () => {
    amendmentFindAtMostOne.mockResolvedValueOnce(null);

    const result = await queryAmendment(where);

    expect(result).toBeNull();
  });
});
