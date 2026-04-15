import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { selectManyDemonstrations } from "./selectManyDemonstrations";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectManyDemonstrations", () => {
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
    const demonstrations = [
      { id: "demonstration-1" },
      { id: "demonstration-2" },
    ] as PrismaDemonstration[];
    demonstrationFindMany.mockResolvedValueOnce(demonstrations);

    const result = await selectManyDemonstrations(where);

    expect(prisma).toHaveBeenCalledExactlyOnceWith();
    expect(demonstrationFindMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstrations);
  });

  it("uses the provided transaction client instead of the default prisma client", async () => {
    const demonstrations = [
      { id: "demonstration-1" },
      { id: "demonstration-2" },
    ] as PrismaDemonstration[];
    mockTransaction.demonstration.findMany = vi.fn().mockResolvedValueOnce(demonstrations);

    const result = await selectManyDemonstrations(where, mockTransaction);

    expect(prisma).not.toHaveBeenCalled();
    expect(mockTransaction.demonstration.findMany).toHaveBeenCalledExactlyOnceWith({ where });
    expect(result).toBe(demonstrations);
  });

  it("returns an empty array when no demonstrations are found", async () => {
    demonstrationFindMany.mockResolvedValueOnce([]);

    const result = await selectManyDemonstrations(where);

    expect(result).toEqual([]);
  });

  it("returns all demonstrations that are found", async () => {
    const demonstrations = [
      { id: "demonstration-1" },
      { id: "demonstration-2" },
    ] as PrismaDemonstration[];
    demonstrationFindMany.mockResolvedValueOnce(demonstrations);

    const result = await selectManyDemonstrations(where);

    expect(result).toBe(demonstrations);
  });
});
