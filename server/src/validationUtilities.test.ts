import { describe, it, expect } from "vitest";
import { findDuplicates, findSetDifferences } from "./validationUtilities";

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

  describe("findSetDifferences", () => {
    it("should return all the objects in the common key if the sets are the same", () => {
      const result = findSetDifferences(new Set(["A", "B", "C"]), new Set(["A", "B", "C"]));
      expect(result).toEqual({
        setsMatch: true,
        common: new Set(["A", "B", "C"]),
        inS1Only: new Set(),
        inS2Only: new Set(),
      });
    });

    it("should correctly report items found in only one list", () => {
      const result = findSetDifferences(
        new Set(["A", "B", "C", "D", "E"]),
        new Set(["A", "B", "C", "E", "F"])
      );
      expect(result).toEqual({
        setsMatch: false,
        common: new Set(["A", "B", "C", "E"]),
        inS1Only: new Set(["D"]),
        inS2Only: new Set(["F"]),
      });
    });

    it("should work regardless of order", () => {
      const result = findSetDifferences(
        new Set(["D", "E", "C", "A", "B"]),
        new Set(["A", "B", "C", "E", "F"])
      );
      expect(result).toEqual({
        setsMatch: false,
        common: new Set(["A", "B", "C", "E"]),
        inS1Only: new Set(["D"]),
        inS2Only: new Set(["F"]),
      });
    });
  });
});
