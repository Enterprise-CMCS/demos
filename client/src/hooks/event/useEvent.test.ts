import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { LogEventArguments, useEvent } from "./useEvent";
import { renderTimestamp } from "util/USDate";

/**
 * MOCKS
 */
vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(() => [vi.fn(), { data: undefined, loading: false, error: undefined }]),
  useMutation: vi.fn(() => [vi.fn(), { data: undefined, loading: false, error: undefined }]),
}));

vi.mock("queries/eventQueries", () => ({
  LOG_EVENT_MUTATION: "LOG_EVENT_MUTATION",
  GET_EVENTS_QUERY: "GET_EVENTS_QUERY",
}));

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({
    pathname: "/mock-path",
  })),
}));

/**
 * TESTS
 */
describe("useEvent", () => {
  it("should provide logEvent function", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.logEvent).toBeDefined();
    expect(typeof result.current.logEvent).toBe("function");
  });

  it("should provide getEvents operation", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.getEvents).toBeDefined();
    expect(result.current.getEvents).toBeDefined();
    expect(typeof result.current.getEvents).toBe("function");
  });

  it("should support LogEventArguments without eventData or route", () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventArguments = {
      eventType: "LOGIN_SUCCEEDED",
    };

    result.current.logEvent(eventInput);
  });

  it("should handle event data properly", () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventArguments = {
      eventType: "LOGIN_SUCCEEDED",
      eventData: {
        userId: "123",
        timestamp: renderTimestamp(new Date()),
        metadata: { source: "navigation" },
      },
    };

    result.current.logEvent(eventInput);
  });
});
