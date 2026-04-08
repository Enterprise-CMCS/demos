import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryAtMostOne } from "../../../prismaUtilities/queryAtMostOne";
import { queryDemonstration } from "./queryDemonstration";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../../../prismaUtilities/queryAtMostOne", () => ({
  queryAtMostOne: vi.fn(),
}));

describe("queryDemonstration", () => {
  const mockPrismaClient = {
    demonstration: {},
  };

  const mockTransaction = {
    demonstration: {},
  } as unknown as PrismaTransactionClient;

  const where = {
    id: "demonstration-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("uses the default prisma client when no transaction client is provided", async () => {
    const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(demonstration);

    const result = await queryDemonstration(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockPrismaClient.demonstration, where);
    expect(result).toBe(demonstration);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(demonstration);

    const result = await queryDemonstration(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(queryAtMostOne).toHaveBeenCalledExactlyOnceWith(mockTransaction.demonstration, where);
    expect(result).toBe(demonstration);
  });

  it("returns null when queryAtMostOne returns null", async () => {
    vi.mocked(queryAtMostOne).mockResolvedValueOnce(null);

    const result = await queryDemonstration(where);

    expect(result).toBeNull();
  });
});
