import { describe, expect, it } from "vitest";
import { Kind, type StringValueNode, type IntValueNode } from "graphql";
import { APPLICATION_STATUS } from "../../constants.js";
import { applicationStatusResolvers } from "./applicationStatusResolvers.js";

describe("applicationStatusResolvers", () => {
  it("accepts valid ApplicationStatus values", () => {
    const validValue = APPLICATION_STATUS[0];
    const validLiteral: StringValueNode = { kind: Kind.STRING, value: validValue };

    expect(applicationStatusResolvers.ApplicationStatus.serialize(validValue)).toBe(validValue);
    expect(applicationStatusResolvers.ApplicationStatus.parseValue(validValue)).toBe(validValue);
    expect(applicationStatusResolvers.ApplicationStatus.parseLiteral(validLiteral, undefined)).toBe(
      validValue
    );
  });

  it("rejects invalid ApplicationStatus values", () => {
    const invalidLiteral: IntValueNode = { kind: Kind.INT, value: "1" };

    expect(() => applicationStatusResolvers.ApplicationStatus.serialize("not-real")).toThrow(
      "Invalid ApplicationStatus value"
    );
    expect(() => applicationStatusResolvers.ApplicationStatus.parseValue("not-real")).toThrow(
      "Invalid ApplicationStatus value"
    );
    expect(() =>
      applicationStatusResolvers.ApplicationStatus.parseLiteral(invalidLiteral, undefined)
    ).toThrow("ApplicationStatus can only parse string values");
  });
});
