import { describe, it, expect, vi } from "vitest";
import { getTagByTagType } from "./getTagByTagType";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getTagByTagType", () => {
  const mockPrismaClient = {
    tag: {
      findMany: vi.fn(),
    },
  };

  it("should make the expected request to the database", async () => {
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    await getTagByTagType("Application");
    expect(mockPrismaClient.tag.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { tagTypeId: "Application" },
    });
  });
});
