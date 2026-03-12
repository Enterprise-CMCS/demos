import { convertRoles } from "./convertRoles";

const mockSubmittedRoles = [
  {
    name: "unit_test",
    memberships: ["demos_read"],
  },
  {
    name: "demos_test",
    memberships: ["demos_write"],
    systemRole: "true",
  },
];

const mockBoolRoles = [
  {
    name: "unit_test",
    memberships: ["demos_read"],
  },
  {
    name: "demos_test",
    memberships: ["demos_write"],
    systemRole: true,
  },
];

const mockMixedRoles = [
  {
    name: "unit_test",
    memberships: ["demos_read"],
    systemRole: "false"
  },
  {
    name: "demos_test",
    memberships: ["demos_write"],
    systemRole: true,
  },
];

const mockRoles = [
  {
    name: "unit_test",
    memberships: ["demos_read"],
    systemRole: false
  },
  {
    name: "demos_test",
    memberships: ["demos_write"],
    systemRole: true,
  },
];

describe("convertRoles", () => {
  test("should properly convert CDK submitted roles to Role[]", () => {
    expect(convertRoles(mockSubmittedRoles)).toEqual(mockRoles)
  });
  test("should properly handle valid roles", () => {
    expect(convertRoles(mockBoolRoles)).toEqual(mockBoolRoles)
  });
  test("should allow empty array", () => {
    expect(convertRoles([])).toEqual([])
  });
  test("should throw if input is unexpected", () => {
    expect(() => convertRoles([{invalid: "value"}])).toThrow("invalid roles submitted")
  });
  test("should throw if input is mixed", () => {
    expect(() => convertRoles(mockMixedRoles)).toThrow("invalid roles submitted")
  });
});
