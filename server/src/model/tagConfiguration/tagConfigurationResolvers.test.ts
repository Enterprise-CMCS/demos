import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDemonstrationTypeNames, getApplicationTags } from "./tagConfigurationResolvers";

// Mock imports
import { getTagListByTagType } from ".";

vi.mock(".", () => ({
  getTagListByTagType: vi.fn(),
}));

describe("tagConfigurationResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getDemonstrationTypeNames", () => {
    it("should query the demonstration type tags", async () => {
      const result = await getDemonstrationTypeNames();
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
