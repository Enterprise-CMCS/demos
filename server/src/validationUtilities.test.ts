import { describe, it, expect } from "vitest";
import { findDuplicates, findListDifferences } from "./validationUtilities";

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

  describe("findListDifferences", () => {
    it("should return an empty object if the lists are the same", () => {
      const result = findListDifferences(["A", "B", "C"], ["A", "B", "C"]);
      expect(result).toEqual({
        listsElementsSame: true,
        inL1Only: [],
        inL2Only: [],
        listsUnique: {
          l1: true,
          l2: true,
        },
      });
    });

    it("should correctly report if the lists have duplicates", () => {
      const result = findListDifferences(["A", "B", "C", "C"], ["A", "B", "C"]);
      expect(result).toEqual({
        listsElementsSame: true,
        inL1Only: [],
        inL2Only: [],
        listsUnique: {
          l1: false,
          l2: true,
        },
      });
    });

    it("should correctly report items found in only one list", () => {
      const result = findListDifferences(["A", "B", "C", "C", "F"], ["A", "B", "C", "E", "E", "F"]);
      expect(result).toEqual({
        listsElementsSame: false,
        inL1Only: [],
        inL2Only: ["E"],
        listsUnique: {
          l1: false,
          l2: false,
        },
      });
    });
  });
});
