import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEvent } from "./useEvent";
import { LogEventInput } from "demos-server";

// Mock Apollo Client
vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(() => [vi.fn(), { data: undefined, loading: false, error: undefined }]),
  useMutation: vi.fn(() => [vi.fn(), { data: undefined, loading: false, error: undefined }]),
}));

// Mock queries
vi.mock("queries/eventQueries", () => ({
  LOG_EVENT_MUTATION: "LOG_EVENT_MUTATION",
  GET_EVENTS_QUERY: "GET_EVENTS_QUERY",
}));

describe("useEvent", () => {
  it("should provide logEvent function", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.logEvent).toBeDefined();
    expect(typeof result.current.logEvent).toBe("function");
  });

  it("should provide getEvents operation", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.getEvents).toBeDefined();
    expect(result.current.getEvents.trigger).toBeDefined();
    expect(typeof result.current.getEvents.trigger).toBe("function");
  });

  it("should support LogEventInput without eventData", () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventInput = {
      eventTypeId: "event-type-1",
      route: "/dashboard",
    };

    result.current.logEvent(eventInput);
  });

  it("should handle event data properly", () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventInput = {
      eventTypeId: "page-view-type",
      route: "/users",
      eventData: {
        userId: "123",
        timestamp: new Date().toISOString(),
        metadata: { source: "navigation" },
      },
    };

    result.current.logEvent(eventInput);
  });
});
