import { describe, it, expect, vi } from "vitest";
import { findDuplicates } from "./validationUtilities";

describe("validationUtilities", () => {
  describe("findDuplicates", () => {
    it("should return an empty list if there are no duplicates", () => {
      const result = findDuplicates(["A", "B", "C"]);
      expect(result).toEqual([]);
    });

    it("should return the duplicated items if they exist", () => {
      const result = findDuplicates(["A", "A", "C", "B", "C"]);
      expect(result).toEqual(["A", "C"]);
    });
  });
});
