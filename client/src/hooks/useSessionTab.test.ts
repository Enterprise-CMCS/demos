import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionTab } from "./useSessionTab";

describe("useSessionTab", () => {
  const key = "selected-tab";
  const defaultValue = "my-deliverables";
  const allowedValues = ["my-deliverables", "deliverables"] as const;

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("uses the default value and stores it when nothing is in session storage", () => {
    const { result } = renderHook(() =>
      useSessionTab({ key, defaultValue, allowedValues })
    );

    expect(result.current[0]).toBe("my-deliverables");
    expect(sessionStorage.getItem(key)).toBe("my-deliverables");
  });

  it("uses stored value when it is allowed", () => {
    sessionStorage.setItem(key, "deliverables");

    const { result } = renderHook(() =>
      useSessionTab({ key, defaultValue, allowedValues })
    );

    expect(result.current[0]).toBe("deliverables");
    expect(sessionStorage.getItem(key)).toBe("deliverables");
  });

  it("falls back to default when stored value is not allowed", () => {
    sessionStorage.setItem(key, "bad-tab-value");

    const { result } = renderHook(() =>
      useSessionTab({ key, defaultValue, allowedValues })
    );

    expect(result.current[0]).toBe("my-deliverables");
    expect(sessionStorage.getItem(key)).toBe("my-deliverables");
  });

  it("updates state and session storage when selecting an allowed tab", () => {
    const { result } = renderHook(() =>
      useSessionTab({ key, defaultValue, allowedValues })
    );

    act(() => {
      result.current[1]("deliverables");
    });

    expect(result.current[0]).toBe("deliverables");
    expect(sessionStorage.getItem(key)).toBe("deliverables");
  });

  it("resets to default when selecting a tab that is not allowed", () => {
    const { result } = renderHook(() =>
      useSessionTab({ key, defaultValue, allowedValues })
    );

    act(() => {
      result.current[1]("not-allowed");
    });

    expect(result.current[0]).toBe("my-deliverables");
    expect(sessionStorage.getItem(key)).toBe("my-deliverables");
  });
});
