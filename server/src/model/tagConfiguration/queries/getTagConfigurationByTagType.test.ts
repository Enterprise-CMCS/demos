import { describe, it, expect, vi } from "vitest";
import { getTagConfigurationByTagType } from "./getTagConfigurationByTagType";

// Mock imports
import { prisma } from "../../../prismaClient.js";

vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("getTagConfigurationByTagType", () => {
  const mockPrismaClient = {
    tagConfiguration: {
      findMany: vi.fn(),
    },
  };

  it("should make the expected request to the database", async () => {
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    await getTagConfigurationByTagType("Application");
    expect(mockPrismaClient.tagConfiguration.findMany).toHaveBeenCalledExactlyOnceWith({
      where: { tagTypeId: "Application" },
    });
  });
});
