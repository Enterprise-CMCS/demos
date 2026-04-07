import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { queryDemonstration } from "./queryDemonstration";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("queryDemonstration", () => {
  const demonstrationFindMany = vi.fn();

  const mockPrismaClient = {
    demonstration: {
      findMany: demonstrationFindMany,
    },
  };

  const mockTransaction = {
    demonstration: {
      findMany: vi.fn(),
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
    demonstrationFindMany.mockResolvedValueOnce([demonstration]);

    const result = await queryDemonstration(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(demonstrationFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstration);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
    mockTransaction.demonstration.findMany = vi.fn().mockResolvedValueOnce([demonstration]);

    const result = await queryDemonstration(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.demonstration.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstration);
  });

  it("returns null when no demonstrations are found", async () => {
    demonstrationFindMany.mockResolvedValueOnce([]);

    const result = await queryDemonstration(where);

    expect(result).toBeNull();
  });

  it("returns the demonstration when exactly one demonstration is found", async () => {
    const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
    demonstrationFindMany.mockResolvedValueOnce([demonstration]);

    const result = await queryDemonstration(where);

    expect(result).toBe(demonstration);
  });

  it("throws when more than one demonstration is found", async () => {
    demonstrationFindMany.mockResolvedValueOnce([
      { id: "demonstration-1" } as PrismaDemonstration,
      { id: "demonstration-2" } as PrismaDemonstration,
    ]);

    await expect(queryDemonstration(where)).rejects.toThrow(
      "Expected to find at most one Demonstration, but found 2"
    );
  });
});
