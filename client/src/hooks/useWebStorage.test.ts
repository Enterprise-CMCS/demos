import { describe, expect, it } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { useLocalStorage, useSessionStorage, useSessionStorageJson } from "./useWebStorage";

describe("useLocalStorage", () => {
  it("returns empty string when no value is stored", () => {
    const { result } = renderHook(() => useLocalStorage("test-key"));
    expect(result.current[0]).toBe("");
  });

  it("reads an existing value from localStorage", () => {
    window.localStorage.setItem("test-key", "hello");
    const { result } = renderHook(() => useLocalStorage("test-key"));
    expect(result.current[0]).toBe("hello");
  });

  it("writes a value to localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("test-key"));
    act(() => result.current[1]("world"));
    expect(result.current[0]).toBe("world");
    expect(window.localStorage.getItem("test-key")).toBe("world");
  });

  it("does not affect sessionStorage when writing", () => {
    const { result } = renderHook(() => useLocalStorage("test-key"));
    act(() => result.current[1]("local-value"));
    expect(window.sessionStorage.getItem("test-key")).toBeNull();
  });
});

describe("useSessionStorage", () => {
  it("returns empty string when no value is stored", () => {
    const { result } = renderHook(() => useSessionStorage("test-key"));
    expect(result.current[0]).toBe("");
  });

  it("reads an existing value from sessionStorage", () => {
    window.sessionStorage.setItem("test-key", "hello");
    const { result } = renderHook(() => useSessionStorage("test-key"));
    expect(result.current[0]).toBe("hello");
  });

  it("writes a value to sessionStorage", () => {
    const { result } = renderHook(() => useSessionStorage("test-key"));
    act(() => result.current[1]("world"));
    expect(result.current[0]).toBe("world");
    expect(window.sessionStorage.getItem("test-key")).toBe("world");
  });

  it("does not affect localStorage when writing", () => {
    const { result } = renderHook(() => useSessionStorage("test-key"));
    act(() => result.current[1]("session-value"));
    expect(window.localStorage.getItem("test-key")).toBeNull();
  });
});

describe("useSessionStorageJson", () => {
  it("returns undefined when no value is stored", () => {
    const { result } = renderHook(() => useSessionStorageJson("dates-key"));
    expect(result.current[0]).toBeUndefined();
  });

  it("reads an existing value from sessionStorage", () => {
    const stored = { startDate: "2025-02-01", endDate: "2025-03-01" };
    window.sessionStorage.setItem("dates-key", JSON.stringify(stored));
    const { result } = renderHook(() => useSessionStorageJson("dates-key"));
    expect(result.current[0]).toEqual(stored);
  });

  it("writes a value to sessionStorage as JSON", () => {
    const { result } = renderHook(() => useSessionStorageJson("dates-key"));
    act(() => result.current[1]({ startDate: "2025-05-01" }));
    expect(result.current[0]).toEqual({ startDate: "2025-05-01" });
    expect(JSON.parse(window.sessionStorage.getItem("dates-key")!)).toEqual({
      startDate: "2025-05-01",
    });
  });

  it("does not affect localStorage when writing", () => {
    const { result } = renderHook(() => useSessionStorageJson("dates-key"));
    act(() => result.current[1]({ startDate: "2025-05-01" }));
    expect(window.localStorage.getItem("dates-key")).toBeNull();
  });
});
