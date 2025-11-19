import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { LogEventArguments, useEvent } from "./useEvent";
import { format } from "date-fns";

/**
 * MOCKS
 */
const mockLogEvent = vi.fn();
const mockGetEvents = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");
  return {
    ...actual,
    useLazyQuery: vi.fn(() => [mockGetEvents, { data: undefined, loading: false, error: undefined }]),
    useMutation: vi.fn(() => [mockLogEvent, { data: undefined, loading: false, error: undefined }]),
  };
});

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
    mockLogEvent.mockClear();
    mockGetEvents.mockClear();
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
      eventType: "Login Succeeded",
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
      eventType: "Login Succeeded",
      eventData: {
        userId: "123",
        timestamp: format(new Date(), "MM/dd/yyyy HH:mm:ss.SSS"),
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
