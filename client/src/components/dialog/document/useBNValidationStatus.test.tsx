import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLazyQuery } from "@apollo/client";
import {
  BN_VALIDATION_MAX_ATTEMPTS,
  BN_VALIDATION_POLL_INTERVAL_MS,
  BN_VALIDATION_STATUS_QUERY,
  useBNValidationStatus,
} from "./useBNValidationStatus";

vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

const validationResponse = (
  status: "Pending" | "In Progress" | "Succeeded" | "Failed",
  errors: { code: string; message: string }[] = []
) => ({
  data: {
    document: {
      id: "doc-1",
      budgetNeutralityValidation: { status, errors },
    },
  },
});

describe("useBNValidationStatus", () => {
  const getValidationStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useLazyQuery).mockReturnValue([
      getValidationStatus,
      {},
    ] as unknown as UseLazyQueryTuple);
  });

  it("configures the validation status query with network-only fetch policy", () => {
    renderHook(() => useBNValidationStatus());

    expect(useLazyQuery).toHaveBeenCalledExactlyOnceWith(BN_VALIDATION_STATUS_QUERY, {
      fetchPolicy: "network-only",
    });
  });

  it("returns immediately when the first poll returns a Succeeded status", async () => {
    getValidationStatus.mockResolvedValueOnce(validationResponse("Succeeded"));

    const { result } = renderHook(() => useBNValidationStatus());

    await expect(result.current.waitForBNValidation("doc-1")).resolves.toEqual({
      status: "Succeeded",
      errors: [],
    });
    expect(getValidationStatus).toHaveBeenCalledExactlyOnceWith({
      variables: { documentId: "doc-1" },
    });
  });

  it("returns immediately with errors when the first poll returns a Failed status", async () => {
    const errors = [{ code: "RULE_A", message: "Cell A1 is required." }];
    getValidationStatus.mockResolvedValueOnce(validationResponse("Failed", errors));

    const { result } = renderHook(() => useBNValidationStatus());

    await expect(result.current.waitForBNValidation("doc-1")).resolves.toEqual({
      status: "Failed",
      errors,
    });
  });

  it("polls past Pending / In Progress responses until a terminal status is reached", async () => {
    getValidationStatus
      .mockResolvedValueOnce(validationResponse("Pending"))
      .mockResolvedValueOnce(validationResponse("In Progress"))
      .mockResolvedValueOnce(validationResponse("Succeeded"));

    const { result } = renderHook(() => useBNValidationStatus());

    const pollPromise = result.current.waitForBNValidation("doc-1");

    await vi.advanceTimersByTimeAsync(BN_VALIDATION_POLL_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(BN_VALIDATION_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toEqual({ status: "Succeeded", errors: [] });
    expect(getValidationStatus).toHaveBeenCalledTimes(3);
  });

  it("treats a null budgetNeutralityValidation field as not-yet-created and keeps polling", async () => {
    getValidationStatus
      .mockResolvedValueOnce({ data: { document: { id: "doc-1", budgetNeutralityValidation: null } } })
      .mockResolvedValueOnce(validationResponse("Succeeded"));

    const { result } = renderHook(() => useBNValidationStatus());

    const pollPromise = result.current.waitForBNValidation("doc-1");

    await vi.advanceTimersByTimeAsync(BN_VALIDATION_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toEqual({ status: "Succeeded", errors: [] });
    expect(getValidationStatus).toHaveBeenCalledTimes(2);
  });

  it("returns the last known non-terminal result after the maximum number of attempts", async () => {
    getValidationStatus.mockResolvedValue(validationResponse("In Progress"));

    const { result } = renderHook(() => useBNValidationStatus());

    const pollPromise = result.current.waitForBNValidation("doc-1");

    await vi.advanceTimersByTimeAsync(BN_VALIDATION_MAX_ATTEMPTS * BN_VALIDATION_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toEqual({ status: "In Progress", errors: [] });
    expect(getValidationStatus).toHaveBeenCalledTimes(BN_VALIDATION_MAX_ATTEMPTS);
  });

  it("returns null when polling times out with no row ever appearing", async () => {
    getValidationStatus.mockResolvedValue({
      data: { document: { id: "doc-1", budgetNeutralityValidation: null } },
    });

    const { result } = renderHook(() => useBNValidationStatus());

    const pollPromise = result.current.waitForBNValidation("doc-1");

    await vi.advanceTimersByTimeAsync(BN_VALIDATION_MAX_ATTEMPTS * BN_VALIDATION_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toBeNull();
    expect(getValidationStatus).toHaveBeenCalledTimes(BN_VALIDATION_MAX_ATTEMPTS);
  });
});
