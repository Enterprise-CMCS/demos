import { Amendment as PrismaAmendment } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";
import { queryAmendment } from "./queryAmendment";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../../prismaUtilities/queryAtMostOne", () => ({
  queryAtMostOne: vi.fn(),
}));

describe("queryAmendment", () => {
  const mockPrismaClient = {
    amendment: {},
  };

  const mockTransaction = {
    amendment: {},
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
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(amendment);

    const result = await queryAmendment(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockPrismaClient.amendment, where);
    expect(result).toBe(amendment);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const amendment = { id: "amendment-1" } as PrismaAmendment;
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(amendment);

    const result = await queryAmendment(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockTransaction.amendment, where);
    expect(result).toBe(amendment);
  });

  it("returns null when queryAtMostOne returns null", async () => {
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(null);

    const result = await queryAmendment(where);

    expect(result).toBeNull();
  });
});
