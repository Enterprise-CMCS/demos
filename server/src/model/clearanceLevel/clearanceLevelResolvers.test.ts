import { describe, expect, it } from "vitest";
import { Kind, type StringValueNode, type IntValueNode } from "graphql";
import { CLEARANCE_LEVELS } from "../../constants.js";
import { clearanceLevelResolvers } from "./clearanceLevelResolvers.js";

describe("clearanceLevelResolvers", () => {
  it("accepts valid ClearanceLevel values", () => {
    const validValue = CLEARANCE_LEVELS[0];
    const validLiteral: StringValueNode = { kind: Kind.STRING, value: validValue };

    expect(clearanceLevelResolvers.ClearanceLevel.serialize(validValue)).toBe(validValue);
    expect(clearanceLevelResolvers.ClearanceLevel.parseValue(validValue)).toBe(validValue);
    expect(clearanceLevelResolvers.ClearanceLevel.parseLiteral(validLiteral, undefined)).toBe(
      validValue
    );
  });

  it("rejects invalid ClearanceLevel values", () => {
    const invalidLiteral: IntValueNode = { kind: Kind.INT, value: "1" };

    expect(() => clearanceLevelResolvers.ClearanceLevel.serialize("not-real")).toThrow(
      "Invalid ClearanceLevel value"
    );
    expect(() => clearanceLevelResolvers.ClearanceLevel.parseValue("not-real")).toThrow(
      "Invalid ClearanceLevel value"
    );
    expect(() =>
      clearanceLevelResolvers.ClearanceLevel.parseLiteral(invalidLiteral, undefined)
    ).toThrow("ClearanceLevel can only parse string values");
  });
});
