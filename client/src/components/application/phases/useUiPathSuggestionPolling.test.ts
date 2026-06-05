import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET_AMENDMENT_APPLICATION_TAG_SUGGESTIONS_QUERY,
  GET_DEMONSTRATION_APPLICATION_TAG_SUGGESTIONS_QUERY,
  GET_EXTENSION_APPLICATION_TAG_SUGGESTIONS_QUERY,
  UIPATH_SUGGESTION_POLL_INTERVAL_MS,
  UIPATH_SUGGESTION_POLL_TIMEOUT_MS,
  useUiPathSuggestionPolling,
} from "./useUiPathSuggestionPolling";

const mocks = vi.hoisted(() => ({
  query: vi.fn(() => Promise.resolve({ data: {} })),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useApolloClient: () => ({
      query: mocks.query,
    }),
  };
});

describe("useUiPathSuggestionPolling", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mocks.query.mockClear();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("does not poll before startPolling is called", async () => {
    renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "app-1",
        workflowApplicationType: "demonstration",
      })
    );

    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_TIMEOUT_MS);

    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("polls the demonstration suggestion query immediately and every 5 seconds", async () => {
    const { result } = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "demo-1",
        workflowApplicationType: "demonstration",
      })
    );

    act(() => result.current.startPolling());
    await vi.advanceTimersByTimeAsync(0);

    expect(mocks.query).toHaveBeenCalledWith({
      query: GET_DEMONSTRATION_APPLICATION_TAG_SUGGESTIONS_QUERY,
      variables: { id: "demo-1" },
      fetchPolicy: "network-only",
    });
    expect(mocks.query).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_INTERVAL_MS);

    expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith("[UiPathSuggestionPolling]", "started", {
      applicationId: "demo-1",
      workflowApplicationType: "demonstration",
    });
    expect(consoleLogSpy).toHaveBeenCalledWith("[UiPathSuggestionPolling]", "refetch", {
      applicationId: "demo-1",
      workflowApplicationType: "demonstration",
    });
  });

  it("starts polling for State Application uploads and ignores General File uploads", async () => {
    const { result } = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "demo-1",
        workflowApplicationType: "demonstration",
      })
    );

    act(() =>
      result.current.startPollingForStateApplicationUpload({
        applicationId: "demo-1",
        name: "General File",
        documentType: "General File",
        phaseName: "Application Intake",
      })
    );
    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_INTERVAL_MS);

    expect(mocks.query).not.toHaveBeenCalled();

    act(() =>
      result.current.startPollingForStateApplicationUpload({
        applicationId: "demo-1",
        name: "State Application",
        documentType: "State Application",
        phaseName: "Application Intake",
      })
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(mocks.query).toHaveBeenCalledTimes(1);
  });

  it("selects the amendment and extension suggestion queries", async () => {
    const amendmentHook = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "amendment-1",
        workflowApplicationType: "amendment",
      })
    );
    act(() => amendmentHook.result.current.startPolling());

    const extensionHook = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "extension-1",
        workflowApplicationType: "extension",
      })
    );
    act(() => extensionHook.result.current.startPolling());
    await vi.advanceTimersByTimeAsync(0);

    expect(mocks.query).toHaveBeenCalledWith({
      query: GET_AMENDMENT_APPLICATION_TAG_SUGGESTIONS_QUERY,
      variables: { id: "amendment-1" },
      fetchPolicy: "network-only",
    });
    expect(mocks.query).toHaveBeenCalledWith({
      query: GET_EXTENSION_APPLICATION_TAG_SUGGESTIONS_QUERY,
      variables: { id: "extension-1" },
      fetchPolicy: "network-only",
    });
  });

  it("stops polling after 2 minutes", async () => {
    const { result } = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "app-1",
        workflowApplicationType: "demonstration",
      })
    );

    act(() => result.current.startPolling());
    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_TIMEOUT_MS);
    const queryCountAtTimeout = mocks.query.mock.calls.length;

    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_INTERVAL_MS);

    expect(mocks.query).toHaveBeenCalledTimes(queryCountAtTimeout);
    expect(consoleLogSpy).toHaveBeenCalledWith("[UiPathSuggestionPolling]", "stopped", {
      applicationId: "app-1",
      workflowApplicationType: "demonstration",
    });
  });

  it("restarts the 2-minute polling window when startPolling is called again", async () => {
    const { result } = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "app-1",
        workflowApplicationType: "demonstration",
      })
    );

    act(() => result.current.startPolling());
    await vi.advanceTimersByTimeAsync(60_000);
    act(() => result.current.startPolling());

    await vi.advanceTimersByTimeAsync(70_000);
    const queryCountBeforeOriginalTimeout = mocks.query.mock.calls.length;
    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_INTERVAL_MS);

    expect(mocks.query.mock.calls.length).toBeGreaterThan(queryCountBeforeOriginalTimeout);
    expect(consoleLogSpy).toHaveBeenCalledWith("[UiPathSuggestionPolling]", "restarted", {
      applicationId: "app-1",
      workflowApplicationType: "demonstration",
    });
  });

  it("logs refetch failures without stopping polling", async () => {
    mocks.query.mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() =>
      useUiPathSuggestionPolling({
        applicationId: "app-1",
        workflowApplicationType: "demonstration",
      })
    );

    act(() => result.current.startPolling());
    await vi.advanceTimersByTimeAsync(0);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[UiPathSuggestionPolling]",
      "refetch failed",
      expect.any(Error)
    );

    await vi.advanceTimersByTimeAsync(UIPATH_SUGGESTION_POLL_INTERVAL_MS);

    expect(mocks.query).toHaveBeenCalledTimes(2);
  });
});
