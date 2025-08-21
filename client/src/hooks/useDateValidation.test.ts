import { vi } from "vitest";

import {
  act,
  renderHook,
} from "@testing-library/react";

import { useDateValidation } from "./useDateValidation";

describe("useDateValidation", () => {
  it("should initialize with empty expiration error", () => {
    const { result } = renderHook(() => useDateValidation());

    expect(result.current.expirationError).toBe("");
  });

  it("should clear expiration date when effective date is after expiration", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetEffectiveDate = vi.fn();
    const mockSetExpirationDate = vi.fn();

    // Test: effective date is after current expiration date
    result.current.handleEffectiveDateChange(
      "2024-07-01", // new effective date
      "2024-06-15", // existing expiration date (before effective)
      mockSetEffectiveDate,
      mockSetExpirationDate
    );

    expect(mockSetEffectiveDate).toHaveBeenCalledWith("2024-07-01");
    expect(mockSetExpirationDate).toHaveBeenCalledWith(""); // Should clear expiration date
  });

  it("should not clear expiration date when effective date is before expiration", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetEffectiveDate = vi.fn();
    const mockSetExpirationDate = vi.fn();

    // Test: effective date is before expiration date (valid)
    result.current.handleEffectiveDateChange(
      "2024-06-01", // new effective date
      "2024-07-15", // existing expiration date (after effective)
      mockSetEffectiveDate,
      mockSetExpirationDate
    );

    expect(mockSetEffectiveDate).toHaveBeenCalledWith("2024-06-01");
    expect(mockSetExpirationDate).not.toHaveBeenCalled(); // Should not clear expiration date
  });

  it("should set error when expiration date is before effective date", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: expiration date before effective date (invalid)
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-05-15", // expiration date
        "2024-06-01", // effective date (after expiration)
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("Expiration Date cannot be before Effective Date.");
    expect(mockSetExpirationDate).not.toHaveBeenCalled();
  });

  it("should clear error and set date when expiration date is after effective date", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: expiration date after effective date (valid)
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-07-15", // expiration date
        "2024-06-01", // effective date (before expiration)
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("");
    expect(mockSetExpirationDate).toHaveBeenCalledWith("2024-07-15");
  });

  it("should allow expiration date when no effective date is set", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: no effective date set
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-07-15", // expiration date
        "", // no effective date
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("");
    expect(mockSetExpirationDate).toHaveBeenCalledWith("2024-07-15");
  });
});
