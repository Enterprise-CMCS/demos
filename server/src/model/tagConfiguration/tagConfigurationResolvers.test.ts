import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDemonstrationTypes, getApplicationTags } from "./tagConfigurationResolvers";

// Mock imports
import { getTagListByTagType } from ".";

vi.mock(".", () => ({
  getTagListByTagType: vi.fn(),
}));

describe("tagConfigurationResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getDemonstrationTypes", () => {
    it("should query the demonstration type tags", async () => {
      const result = await getDemonstrationTypes();
      expect(getTagListByTagType).toHaveBeenCalledExactlyOnceWith("Demonstration Type");
    });
  });

  describe("getApplicationTags", () => {
    it("should query the application tags", async () => {
      const result = await getApplicationTags();
      expect(getTagListByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    });
  });
});
