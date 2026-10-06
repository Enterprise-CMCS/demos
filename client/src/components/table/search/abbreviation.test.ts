import { describe, expect, it } from "vitest";
import {
  isStateAbbreviation,
  expandAbbreviation,
  getAbbreviationForState,
  getAllStateAbbreviations,
} from "./abbreviation";

describe("State Abbreviation Utilities", () => {
  describe("isStateAbbreviation", () => {
    it("returns true for valid two-letter state abbreviations", () => {
      expect(isStateAbbreviation("NC")).toBe(true);
      expect(isStateAbbreviation("CA")).toBe(true);
      expect(isStateAbbreviation("PR")).toBe(true);
      expect(isStateAbbreviation("GU")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isStateAbbreviation("nc")).toBe(true);
      expect(isStateAbbreviation("Nc")).toBe(true);
      expect(isStateAbbreviation("nC")).toBe(true);
    });

    it("returns false for invalid abbreviations", () => {
      expect(isStateAbbreviation("North Carolina")).toBe(false);
      expect(isStateAbbreviation("XYZ")).toBe(false);
      expect(isStateAbbreviation("N")).toBe(false);
      expect(isStateAbbreviation("ABC")).toBe(false);
    });

    it("returns false for empty strings", () => {
      expect(isStateAbbreviation("")).toBe(false);
    });
  });

  describe("expandAbbreviation", () => {
    it("expands valid state abbreviations to full names", () => {
      expect(expandAbbreviation("NC")).toBe("North Carolina");
      expect(expandAbbreviation("CA")).toBe("California");
      expect(expandAbbreviation("PR")).toBe("Puerto Rico");
      expect(expandAbbreviation("GU")).toBe("Guam");
    });

    it("is case-insensitive", () => {
      expect(expandAbbreviation("nc")).toBe("North Carolina");
      expect(expandAbbreviation("Nc")).toBe("North Carolina");
    });

    it("returns null for invalid abbreviations", () => {
      expect(expandAbbreviation("North Carolina")).toBeNull();
      expect(expandAbbreviation("XYZ")).toBeNull();
      expect(expandAbbreviation("N")).toBeNull();
    });

    it("returns null for empty strings", () => {
      expect(expandAbbreviation("")).toBeNull();
    });

    it("handles all territories", () => {
      expect(expandAbbreviation("AS")).toBe("American Samoa");
      expect(expandAbbreviation("FM")).toBe("Federated States of Micronesia");
      expect(expandAbbreviation("MP")).toBe("Northern Mariana Islands");
      expect(expandAbbreviation("PW")).toBe("Republic of Palau");
      expect(expandAbbreviation("MH")).toBe("Republic of the Marshall Islands");
      expect(expandAbbreviation("VI")).toBe("US Virgin Islands");
    });
  });

  describe("getAbbreviationForState", () => {
    it("gets abbreviations for full state names", () => {
      expect(getAbbreviationForState("North Carolina")).toBe("NC");
      expect(getAbbreviationForState("California")).toBe("CA");
      expect(getAbbreviationForState("Puerto Rico")).toBe("PR");
    });

    it("returns null for invalid state names", () => {
      expect(getAbbreviationForState("NC")).toBeNull();
      expect(getAbbreviationForState("invalid")).toBeNull();
    });

    it("returns null for empty strings", () => {
      expect(getAbbreviationForState("")).toBeNull();
    });

    it("handles all territories", () => {
      expect(getAbbreviationForState("American Samoa")).toBe("AS");
      expect(getAbbreviationForState("Puerto Rico")).toBe("PR");
      expect(getAbbreviationForState("US Virgin Islands")).toBe("VI");
    });
  });

  describe("getAllStateAbbreviations", () => {
    it("returns all valid state and territory abbreviations", () => {
      const abbreviations = getAllStateAbbreviations();

      expect(abbreviations).toContain("NC");
      expect(abbreviations).toContain("CA");
      expect(abbreviations).toContain("PR");
      expect(abbreviations).toContain("GU");
      expect(abbreviations).toContain("DC");
    });

    it("returns 56 entries for all US states and territories", () => {
      const abbreviations = getAllStateAbbreviations();
      expect(abbreviations).toHaveLength(56);
    });

    it("returns uppercase abbreviations", () => {
      const abbreviations = getAllStateAbbreviations();
      abbreviations.forEach((abbr) => {
        expect(abbr).toMatch(/^[A-Z]{2}$/);
      });
    });

    it("has no duplicates", () => {
      const abbreviations = getAllStateAbbreviations();
      const uniqueAbbreviations = new Set(abbreviations);
      expect(uniqueAbbreviations.size).toBe(abbreviations.length);
    });
  });
});
