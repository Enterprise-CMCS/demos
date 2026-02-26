import { describe, expect, it } from "vitest";
import { Kind, type StringValueNode, type IntValueNode } from "graphql";
import { DATE_TYPES } from "../../constants.js";
import { dateTypeResolvers } from "./dateTypeResolvers.js";

describe("dateTypeResolvers", () => {
  it("accepts valid DateType values", () => {
    const validValue = DATE_TYPES[0];
    const validLiteral: StringValueNode = { kind: Kind.STRING, value: validValue };

    expect(dateTypeResolvers.DateType.serialize(validValue)).toBe(validValue);
    expect(dateTypeResolvers.DateType.parseValue(validValue)).toBe(validValue);
    expect(dateTypeResolvers.DateType.parseLiteral(validLiteral, undefined)).toBe(validValue);
  });

  it("rejects invalid DateType values", () => {
    const invalidLiteral: IntValueNode = { kind: Kind.INT, value: "1" };

    expect(() => dateTypeResolvers.DateType.serialize("not-real")).toThrow("Invalid DateType value");
    expect(() => dateTypeResolvers.DateType.parseValue("not-real")).toThrow("Invalid DateType value");
    expect(() => dateTypeResolvers.DateType.parseLiteral(invalidLiteral, undefined)).toThrow(
      "DateType can only parse string values"
    );
  });
});
