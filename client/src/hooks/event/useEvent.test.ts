import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { LogEventArguments, useEvent } from "./useEvent";
import { formatDateTime } from "util/formatDate";

/**
 * MOCKS
 */
const mockLogEvent = vi.fn();
vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(() => [vi.fn(), { data: undefined, loading: false, error: undefined }]),
  useMutation: vi.fn(() => [mockLogEvent, { data: undefined, loading: false, error: undefined }]),
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
  beforeEach(() => {
    mockLogEvent.mockClear(); // ✅ Added: Clear the mock before each test
  });

  it("should provide logEvent function", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.logEvent).toBeDefined();
    expect(typeof result.current.logEvent).toBe("function");
  });

  it("should provide getEvents operation", () => {
    const { result } = renderHook(() => useEvent());

    expect(result.current.getEvents).toBeDefined();
    expect(typeof result.current.getEvents).toBe("function");
  });

  it("should support LogEventArguments without eventData or route", async () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventArguments = {
      eventType: "LOGIN_SUCCEEDED",
    };

    await result.current.logEvent(eventInput);

    const calledWith = mockLogEvent.mock.calls[0][0]; // The first call's first argument
    const { variables } = calledWith;
    const { input: loggedInput } = variables;

    expect(loggedInput.eventData).toHaveProperty("appVersion");
    expect(loggedInput.eventData).toHaveProperty("stackTrace");
    expect(typeof loggedInput.eventData.stackTrace).toBe("string");
    expect(loggedInput.route).toBe("/mock-path");
  });

  it("should handle event data properly", async () => {
    const { result } = renderHook(() => useEvent());

    const eventInput: LogEventArguments = {
      eventType: "LOGIN_SUCCEEDED",
      eventData: {
        userId: "123",
        timestamp: formatDateTime(new Date(), "millisecond"),
        metadata: { source: "navigation" },
      },
    };

    await result.current.logEvent(eventInput);

    const calledWith = mockLogEvent.mock.calls[0][0];
    const { variables } = calledWith;
    const { input: loggedInput } = variables;

    expect(loggedInput.eventData.userId).toBe("123");
    expect(loggedInput.eventData).toHaveProperty("appVersion");
    expect(loggedInput.eventData).toHaveProperty("stackTrace");
    expect(typeof loggedInput.eventData.stackTrace).toBe("string");
    expect(loggedInput.route).toBe("/mock-path");
  });
});
