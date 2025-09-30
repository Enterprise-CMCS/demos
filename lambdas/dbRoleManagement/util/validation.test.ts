import { hasDuplicates, isValidRoleName } from "./validation";

describe("validation", () => {
  describe("hasDuplicates", () => {
    test("should return proper bool", () => {
      expect(hasDuplicates(["one", "two"])).toEqual(false);
      expect(hasDuplicates(["one", "one"])).toEqual(true);
    });
  });

  describe("isValidRoleName", () => {
    test("should return proper bool", () => {
      expect(isValidRoleName("valid_role")).toEqual(true);
      expect(isValidRoleName("hyphens-not-allowed")).toEqual(false);
      expect(isValidRoleName("NO_uppercase")).toEqual(false);
    });
  });
});
