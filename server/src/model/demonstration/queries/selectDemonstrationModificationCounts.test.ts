import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectDemonstrationModificationCounts } from "./selectDemonstrationModificationCounts";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDemonstrationModificationCounts", () => {
  const findMany = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      demonstration: { findMany },
    } as never);
  });

  it("selects and maps amendment and extension counts for each demonstration", async () => {
    findMany.mockResolvedValue([
      {
        id: "demo-1",
        _count: {
          amendments: 2,
          extensions: 3,
        },
      },
    ]);

    await expect(
      selectDemonstrationModificationCounts(["demo-1"]),
    ).resolves.toEqual([
      {
        id: "demo-1",
        amendmentCount: 2,
        extensionCount: 3,
      },
    ]);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: { in: ["demo-1"] } },
      select: {
        id: true,
        _count: {
          select: {
            amendments: true,
            extensions: true,
          },
        },
      },
    });
  });
});
