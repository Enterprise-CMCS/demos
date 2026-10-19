
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useFormValidation } from "./useFormValidation";

type FormValues = {
  name: string;
  email: string;
};

const validators = {
  name: (value: string) =>
    value.trim() ? undefined : "Name is required.",
  email: (value: string) =>
    value.trim() ? undefined : "Email is required.",
};

describe("useFormValidation", () => {
  it("returns no errors for valid initial values", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "John", email: "john@example.com" },
        validators
      )
    );

    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.getError("name")).toBeUndefined();
    expect(result.current.getError("email")).toBeUndefined();
  });

  it("calculates errors for invalid values", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "", email: " " },
        validators
      )
    );

    expect(result.current.errors).toEqual({
      name: "Name is required.",
      email: "Email is required.",
    });
    expect(result.current.isValid).toBe(false);
  });

  it("hides validation errors until a field is touched", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "", email: "" },
        validators
      )
    );

    expect(result.current.getError("name")).toBeUndefined();
    expect(result.current.getError("email")).toBeUndefined();

    act(() => {
      result.current.markTouched("name");
    });

    expect(result.current.getError("name")).toBe(
      "Name is required."
    );
    expect(result.current.getError("email")).toBeUndefined();
  });

  it("only reveals the error for the field that was touched", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "", email: "" },
        validators
      )
    );

    act(() => {
      result.current.markTouched("email");
    });

    expect(result.current.getError("name")).toBeUndefined();
    expect(result.current.getError("email")).toBe(
      "Email is required."
    );
  });

  it("clears a validation error when the field value becomes valid", () => {
    const { result, rerender } = renderHook(
      ({ values }) => useFormValidation<FormValues>(values, validators),
      {
        initialProps: {
          values: { name: "", email: "" },
        },
      }
    );

    act(() => {
      result.current.markTouched("name");
    });

    expect(result.current.getError("name")).toBe(
      "Name is required."
    );

    rerender({
      values: { name: "John", email: "" },
    });

    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.getError("name")).toBeUndefined();
    expect(result.current.isValid).toBe(false);
  });

  it("marks all fields as touched when validateAll is called", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "", email: "" },
        validators
      )
    );

    let isValid: boolean;

    act(() => {
      isValid = result.current.validateAll();
    });

    expect(isValid!).toBe(false);
    expect(result.current.getError("name")).toBe(
      "Name is required."
    );
    expect(result.current.getError("email")).toBe(
      "Email is required."
    );
  });

  it("returns true from validateAll when all fields are valid", () => {
    const { result } = renderHook(() =>
      useFormValidation<FormValues>(
        { name: "John", email: "john@example.com" },
        validators
      )
    );

    let isValid: boolean;

    act(() => {
      isValid = result.current.validateAll();
    });

    expect(isValid!).toBe(true);
    expect(result.current.isValid).toBe(true);
  });

  it("keeps a field touched when its value changes", () => {
    const { result, rerender } = renderHook(
      ({ values }) => useFormValidation<FormValues>(values, validators),
      {
        initialProps: {
          values: { name: "", email: "" },
        },
      }
    );

    act(() => {
      result.current.markTouched("name");
    });

    rerender({
      values: { name: "", email: "john@example.com" },
    });

    expect(result.current.getError("name")).toBe(
      "Name is required."
    );
  });
});
