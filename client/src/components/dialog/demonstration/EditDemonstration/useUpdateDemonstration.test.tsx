import { renderHook } from "@testing-library/react";
import { useMutation } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";
import { UPDATE_DEMONSTRATION_MUTATION, useUpdateDemonstration } from "./useUpdateDemonstration";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");

  return {
    ...actual,
    useMutation: vi.fn(),
  };
});

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

type UseMutationTuple = ReturnType<typeof useMutation>;

const DEMONSTRATION_ID = "demo-1";
const DEMONSTRATION_INPUT = {
  name: "Updated Demonstration",
  description: "Updated description",
  effectiveDate: "2024-01-01",
  expirationDate: "2025-01-01",
  sdgDivision: "Division of System Reform Demonstrations",
  projectOfficerUserId: "user-2",
} as const;

describe("useUpdateDemonstration", () => {
  const updateDemonstration = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(useMutation).mockReturnValue([
      updateDemonstration,
      { loading: false },
    ] as unknown as UseMutationTuple);
  });

  it("configures the update mutation", () => {
    renderHook(() => useUpdateDemonstration({ onSuccess }));

    expect(useMutation).toHaveBeenCalledExactlyOnceWith(UPDATE_DEMONSTRATION_MUTATION);
  });

  it("returns the mutation loading state as saving", () => {
    vi.mocked(useMutation).mockReturnValue([
      updateDemonstration,
      { loading: true },
    ] as unknown as UseMutationTuple);

    const { result } = renderHook(() => useUpdateDemonstration({ onSuccess }));

    expect(result.current.saving).toBe(true);
  });

  it("submits the update mutation, refetches the demonstrations page, and shows success", async () => {
    updateDemonstration.mockResolvedValue({
      data: { updateDemonstration: { id: DEMONSTRATION_ID } },
    });

    const { result } = renderHook(() => useUpdateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_ID, DEMONSTRATION_INPUT);

    expect(updateDemonstration).toHaveBeenCalledExactlyOnceWith({
      variables: {
        id: DEMONSTRATION_ID,
        input: DEMONSTRATION_INPUT,
      },
      refetchQueries: [DEMONSTRATIONS_PAGE_QUERY],
    });
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith();
    expect(mockShowSuccess).toHaveBeenCalledExactlyOnceWith("Your demonstration is ready.");
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("shows an error when the mutation resolves with GraphQL errors", async () => {
    const errors = [new Error("GraphQL error")];
    updateDemonstration.mockResolvedValue({ errors });

    const { result } = renderHook(() => useUpdateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_ID, DEMONSTRATION_INPUT);

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
      "Your demonstration was not updated because of an unknown problem."
    );
    expect(console.error).toHaveBeenCalledExactlyOnceWith(errors);
  });

  it("shows an error when the mutation throws", async () => {
    const error = new Error("request failed");
    updateDemonstration.mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_ID, DEMONSTRATION_INPUT);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
      "Your demonstration was not updated because of an unknown problem."
    );
    expect(console.error).toHaveBeenCalledExactlyOnceWith("Update Demonstration failed:", error);
  });
});
