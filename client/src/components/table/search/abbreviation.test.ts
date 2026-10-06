import { describe, expect, it } from "vitest";
import { expandAbbreviation } from "./abbreviation";

describe("State Abbreviation Utilities", () => {
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

    it("returns empty string for invalid abbreviations", () => {
      expect(expandAbbreviation("North Carolina")).toBe("");
      expect(expandAbbreviation("XYZ")).toBe("");
      expect(expandAbbreviation("N")).toBe("");
    });

    it("returns empty string for empty strings", () => {
      expect(expandAbbreviation("")).toBe("");
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
});
