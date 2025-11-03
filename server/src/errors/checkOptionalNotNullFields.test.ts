import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkOptionalNotNullFields } from "./checkOptionalNotNullFields";

describe("checkOptionalNotNullFields", () => {
  it("should not throw if a field is allowed to be null", () => {
    const testObject = {
      foo: null,
      bar: "Value",
    };
    expect(() => checkOptionalNotNullFields(["bar"], testObject)).not.toThrow();
  });
  it("should throw if a field is not allowed to be null", () => {
    const testObject = {
      foo: null,
      bar: "Value",
    };
    expect(() => checkOptionalNotNullFields(["foo", "bar"], testObject)).toThrowError(
      "Field (foo) may not be set to null if it is provided."
    );
  });
  it("should handle multiple failing fields", () => {
    const testObject = {
      foo: null,
      bar: "Value",
      baz: null,
    };
    expect(() => checkOptionalNotNullFields(["foo", "bar", "baz"], testObject)).toThrowError(
      "Field (foo) may not be set to null if it is provided., Field (baz) may not be set to null if it is provided."
    );
  });
});
