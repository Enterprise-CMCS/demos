import { describe, expect, it } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { useLocalStorage, useSessionStorage } from "./useWebStorage";

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
