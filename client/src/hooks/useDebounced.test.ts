import { describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { useDebounced } from "./useDebounced";

// Mock timers
vi.useFakeTimers();

describe("useDebounced", () => {
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounced("initial", 250));
    expect(result.current).toBe("initial");
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounced(value, delay), {
      initialProps: { value: "initial", delay: 250 },
    });

    expect(result.current).toBe("initial");

    // Change the value
    rerender({ value: "updated", delay: 250 });

    // Should still have the old value before debounce timeout
    expect(result.current).toBe("initial");

    // Fast-forward time to trigger the debounce
    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Now should have the new value
    expect(result.current).toBe("updated");
  });

  it("cancels previous timeout when value changes quickly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 250), {
      initialProps: { value: "initial" },
    });

    // Change value multiple times quickly
    rerender({ value: "first" });
    rerender({ value: "second" });
    rerender({ value: "final" });

    // Fast-forward less than the debounce delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be initial value
    expect(result.current).toBe("initial");

    // Fast-forward to complete the debounce
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should be the final value (previous timeouts were cancelled)
    expect(result.current).toBe("final");
  });

  it("works with different data types", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 100), {
      initialProps: { value: 42 },
    });

    expect(result.current).toBe(42);

    rerender({ value: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(100);
  });

  it("uses default delay of 250ms when no delay specified", () => {
    const { result, rerender } = renderHook(() => useDebounced("test"));

    rerender();

    act(() => {
      vi.advanceTimersByTime(249);
    });

    // Should not be updated yet (default 250ms)
    expect(result.current).toBe("test");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Now should be updated
    expect(result.current).toBe("test");
  });
});
