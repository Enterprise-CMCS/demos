import { describe, expect, it } from "vitest";
import { required } from "./required";

describe("required", () => {
  const validate = required("Document Title");

  it.each(["", "   ", "\t", "\n"])(
    "rejects blank strings",
    (value) => {
      expect(validate(value)).toBe("Document Title is required.");
    }
  );

  it.each([null, undefined])("rejects %s", (value) => {
    expect(validate(value)).toBe("Document Title is required.");
  });

  it("accepts a non-empty string", () => {
    expect(validate("My Document")).toBeUndefined();
  });

  it("accepts zero and false", () => {
    expect(validate(0)).toBeUndefined();
    expect(validate(false)).toBeUndefined();
  });
});
