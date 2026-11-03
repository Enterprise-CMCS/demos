import { describe, expect, it } from "vitest";
import { expandAbbreviation } from "./abbreviation";

describe("State Abbreviation Utilities", () => {
  describe("expandAbbreviation", () => {
    it("returns abbreviation and full name for valid abbreviations", () => {
      expect(expandAbbreviation("NC")).toEqual(["NC", "North Carolina"]);
      expect(expandAbbreviation("CA")).toEqual(["CA", "California"]);
      expect(expandAbbreviation("PR")).toEqual(["PR", "Puerto Rico"]);
      expect(expandAbbreviation("GU")).toEqual(["GU", "Guam"]);
    });

    it("is case-insensitive for lookup but preserves input case", () => {
      expect(expandAbbreviation("nc")).toEqual(["nc", "North Carolina"]);
      expect(expandAbbreviation("Nc")).toEqual(["Nc", "North Carolina"]);
    });

    it("returns single token array for invalid abbreviations", () => {
      expect(expandAbbreviation("North Carolina")).toEqual(["North Carolina"]);
      expect(expandAbbreviation("XYZ")).toEqual(["XYZ"]);
      expect(expandAbbreviation("N")).toEqual(["N"]);
    });

    it("returns single token array for empty strings", () => {
      expect(expandAbbreviation("")).toEqual([""]);
    });

    it("handles all territories", () => {
      expect(expandAbbreviation("AS")).toEqual(["AS", "American Samoa"]);
      expect(expandAbbreviation("FM")).toEqual(["FM", "Federated States of Micronesia"]);
      expect(expandAbbreviation("MP")).toEqual(["MP", "Northern Mariana Islands"]);
      expect(expandAbbreviation("PW")).toEqual(["PW", "Republic of Palau"]);
      expect(expandAbbreviation("MH")).toEqual(["MH", "Republic of the Marshall Islands"]);
      expect(expandAbbreviation("VI")).toEqual(["VI", "US Virgin Islands"]);
    });

    it("expands all 56 states and territories", () => {
      const stateTests = [
        ["AL", "Alabama"],
        ["AK", "Alaska"],
        ["AZ", "Arizona"],
        ["AR", "Arkansas"],
        ["CA", "California"],
        ["CO", "Colorado"],
        ["CT", "Connecticut"],
        ["DE", "Delaware"],
        ["FL", "Florida"],
        ["GA", "Georgia"],
        ["HI", "Hawaii"],
        ["ID", "Idaho"],
        ["IL", "Illinois"],
        ["IN", "Indiana"],
        ["IA", "Iowa"],
        ["KS", "Kansas"],
        ["KY", "Kentucky"],
        ["LA", "Louisiana"],
        ["ME", "Maine"],
        ["MD", "Maryland"],
        ["MA", "Massachusetts"],
        ["MI", "Michigan"],
        ["MN", "Minnesota"],
        ["MS", "Mississippi"],
        ["MO", "Missouri"],
        ["MT", "Montana"],
        ["NE", "Nebraska"],
        ["NV", "Nevada"],
        ["NH", "New Hampshire"],
        ["NJ", "New Jersey"],
        ["NM", "New Mexico"],
        ["NY", "New York"],
        ["NC", "North Carolina"],
        ["ND", "North Dakota"],
        ["OH", "Ohio"],
        ["OK", "Oklahoma"],
        ["OR", "Oregon"],
        ["PA", "Pennsylvania"],
        ["RI", "Rhode Island"],
        ["SC", "South Carolina"],
        ["SD", "South Dakota"],
        ["TN", "Tennessee"],
        ["TX", "Texas"],
        ["UT", "Utah"],
        ["VT", "Vermont"],
        ["VA", "Virginia"],
        ["WA", "Washington"],
        ["WV", "West Virginia"],
        ["WI", "Wisconsin"],
        ["WY", "Wyoming"],
        ["DC", "District of Columbia"],
        ["AS", "American Samoa"],
        ["GU", "Guam"],
        ["MP", "Northern Mariana Islands"],
        ["PR", "Puerto Rico"],
        ["VI", "US Virgin Islands"],
        ["FM", "Federated States of Micronesia"],
        ["MH", "Republic of the Marshall Islands"],
        ["PW", "Republic of Palau"],
      ];

      stateTests.forEach(([abbr, name]) => {
        expect(expandAbbreviation(abbr)).toEqual([abbr, name]);
      });
    });
  });
});
