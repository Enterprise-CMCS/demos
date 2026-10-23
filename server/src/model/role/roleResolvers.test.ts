import { Kind } from "graphql";
import { describe, expect, it } from "vitest";
import { roleResolvers } from "./roleResolvers";

describe("Role scalar", () => {
  it("accepts and returns CMCS Other Point of Contact unchanged", () => {
    const role = "CMCS Other Point of Contact";

    expect(roleResolvers.Role.parseValue(role)).toBe(role);
    expect(
      roleResolvers.Role.parseLiteral({ kind: Kind.STRING, value: role }, {}),
    ).toBe(role);
    expect(roleResolvers.Role.serialize(role)).toBe(role);
  });
});
