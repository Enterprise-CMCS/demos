import { describe, it, expect } from "vitest";
import { verifyRole, extractExternalUserIdFromIdentities, createHeaderGetter } from "./auth.util";
import { GraphQLError } from "graphql";

describe("auth.util", () => {
  describe("verifyRole", () => {
    it("should accept valid person types", () => {
      expect(() => verifyRole("demos-admin")).not.toThrow();
    });

    it("should throw for invalid person types", () => {
      expect(() => verifyRole("not a real thing")).toThrow("Invalid user role: 'not a real thing'");
    });
  });

  describe("extractExternalUserIdFromIdentities", () => {
    it("should return userId when identities is a JSON string of a single object", () => {
      const identities = JSON.stringify({ userId: " external-123 " });
      const result = extractExternalUserIdFromIdentities(identities);
      expect(result).toBe("external-123");
    });

    it("should return the first non-empty userId when identities is a JSON string array", () => {
      const identities = JSON.stringify([
        { userId: "" },
        { userId: "   " },
        { userId: " user-abc " },
        { userId: "ignored" },
      ]);

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("user-abc");
    });

    it("should return userId when identities is an object", () => {
      const identities = { userId: " direct-456 " };

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("direct-456");
    });

    it("should return first non-empty userId when identities is an array of objects", () => {
      const identities = [
        { someOtherField: "x" },
        { userId: "" },
        { userId: "   " },
        { userId: " final-id " },
      ];

      const result = extractExternalUserIdFromIdentities(identities);

      expect(result).toBe("final-id");
    });

    it("should fall back to rawAll['cognito:username'] when no userId is found", () => {
      const identities = [{ someField: "no userId here" }, { userId: "" }, { userId: "   " }];
      const rawAll = { "cognito:username": "  cognito-user-789  " };

      const result = extractExternalUserIdFromIdentities(identities, rawAll);

      expect(result).toBe("cognito-user-789");
    });

    it("should return undefined when neither userId nor cognito:username is available", () => {
      const identities = [{ foo: "bar" }];
      const rawAll = { "cognito:username": 1234 }; // not a string

      const result = extractExternalUserIdFromIdentities(identities, rawAll);

      expect(result).toBeUndefined();
    });
  });

  describe("createHeaderGetter", () => {
    it("should return a function", () => {
      const getter = createHeaderGetter({});
      expect(typeof getter).toBe("function");
    });

    it("should get the existing header in a case-insensitive way", () => {
      const getter = createHeaderGetter({
        "Content-Type": "application/json",
        "X-Custom-Header": "foobar",
      });

      expect(getter("Content-Type")).toBe("application/json");
      expect(getter("content-type")).toBe("application/json");
      expect(getter("CONTENT-TYPE")).toBe("application/json");

      expect(getter("X-Custom-Header")).toBe("foobar");
      expect(getter("x-custom-header")).toBe("foobar");
    });

    it("should return undefined for a missing header", () => {
      const getter = createHeaderGetter({
        "Content-Type": "application/json",
      });

      expect(getter("Authorization")).toBeUndefined();
    });

    it("should handle an undefined input object", () => {
      const getter = createHeaderGetter(undefined);

      expect(getter("anything")).toBeUndefined();
    });

    it("should handle a null input object", () => {
      const getter = createHeaderGetter(null);

      expect(getter("anything")).toBeUndefined();
    });

    it("should work when some values are explicitly undefined", () => {
      const getter = createHeaderGetter({
        "X-Has-No-Value": undefined,
        "X-Other": "value",
      });

      expect(getter("X-Has-No-Value")).toBeUndefined();
      expect(getter("x-has-no-value")).toBeUndefined();
      expect(getter("X-Other")).toBe("value");
    });
  });
});
