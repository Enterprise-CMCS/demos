import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDemonstrationTypes, getApplicationTags } from "./tagResolvers";

// Mock imports
import { getFormattedTagsByTagType } from ".";

vi.mock(".", () => ({
  getFormattedTagsByTagType: vi.fn(),
}));

describe("tagResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getDemonstrationTypes", () => {
    it("should query the demonstration type tags", async () => {
      await getDemonstrationTypes();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Demonstration Type");
    });
  });

  describe("getApplicationTags", () => {
    it("should query the application tags", async () => {
      await getApplicationTags();
      expect(getFormattedTagsByTagType).toHaveBeenCalledExactlyOnceWith("Application");
    });
  });
});
