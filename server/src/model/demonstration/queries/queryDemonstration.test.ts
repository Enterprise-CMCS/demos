import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryDemonstration } from "./queryDemonstration";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryDemonstration", () => {
  const demonstrationFindAtMostOne = vi.fn();

  const mockPrismaClient = {
    demonstration: {
      findAtMostOne: demonstrationFindAtMostOne,
    },
  };

  const mockTransaction = {
    demonstration: {
      findAtMostOne: vi.fn(),
    },
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
    demonstrationFindAtMostOne.mockResolvedValueOnce(demonstration);

    const result = await queryDemonstration(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(demonstrationFindAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstration);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
    mockTransaction.demonstration.findAtMostOne = vi.fn().mockResolvedValueOnce(demonstration);

    const result = await queryDemonstration(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.demonstration.findAtMostOne).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstration);
  });

  it("returns null when no demonstration is found", async () => {
    demonstrationFindAtMostOne.mockResolvedValueOnce(null);

    const result = await queryDemonstration(where);

    expect(result).toBeNull();
  });
});
