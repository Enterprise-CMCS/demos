import { describe, it, expect, vi } from "vitest";
import { getTagsByTagType } from "./getTagsByTagType.js";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getTagsByTagType", () => {
  const mockPrismaClient = {
    tag: {
      findMany: vi.fn(),
    },
  };

  it("should make the expected request to the database", async () => {
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    await getTagsByTagType("Application");
    expect(mockPrismaClient.tag.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { tagTypeId: "Application" },
    });
  });
});
