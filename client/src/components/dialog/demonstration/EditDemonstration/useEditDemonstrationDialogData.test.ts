import { renderHook } from "@testing-library/react";
import { useQuery } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EDIT_DEMONSTRATION_DIALOG_QUERY,
  useEditDemonstrationDialogData,
} from "./useEditDemonstrationDialogData";

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");

  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

type UseQueryResult = ReturnType<typeof useQuery>;

const DEMONSTRATION_ID = "demo-1";
const DEMONSTRATION = {
  id: DEMONSTRATION_ID,
  name: "Demonstration",
  description: "Description",
  state: { id: "AL" },
  sdgDivision: "Division of Eligibility and Coverage Demonstrations",
  signatureLevel: "OA",
  primaryProjectOfficer: { id: "user-1" },
  effectiveDate: "2024-01-01",
  expirationDate: "2025-01-01",
  status: "Approved",
};

describe("useEditDemonstrationDialogData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockReturnValue({
      data: { demonstration: DEMONSTRATION },
      loading: false,
      error: undefined,
    } as unknown as UseQueryResult);
  });

  it("queries the edit demonstration dialog data for the given id", () => {
    renderHook(() => useEditDemonstrationDialogData(DEMONSTRATION_ID));

    expect(useQuery).toHaveBeenCalledExactlyOnceWith(EDIT_DEMONSTRATION_DIALOG_QUERY, {
      variables: { id: DEMONSTRATION_ID },
    });
  });

  it("returns the demonstration, loading state, and error from the query", () => {
    const { result } = renderHook(() => useEditDemonstrationDialogData(DEMONSTRATION_ID));

    expect(result.current).toEqual({
      demonstration: DEMONSTRATION,
      loading: false,
      error: undefined,
    });
  });

  it("returns an undefined demonstration while loading", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as unknown as UseQueryResult);

    const { result } = renderHook(() => useEditDemonstrationDialogData(DEMONSTRATION_ID));

    expect(result.current).toEqual({
      demonstration: undefined,
      loading: true,
      error: undefined,
    });
  });

  it("returns the query error", () => {
    const error = new Error("request failed");
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error,
    } as unknown as UseQueryResult);

    const { result } = renderHook(() => useEditDemonstrationDialogData(DEMONSTRATION_ID));

    expect(result.current).toEqual({
      demonstration: undefined,
      loading: false,
      error,
    });
  });
});
