import { renderHook } from "@testing-library/react";
import { useMutation } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CREATE_DEMONSTRATION_MUTATION, useCreateDemonstration } from "./useCreateDemonstration";
import { DEMONSTRATIONS_PAGE_QUERY } from "pages/DemonstrationsPage";

const mockCreateDemonstration = vi.fn();
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

const DEMONSTRATION_INPUT = {
  name: "Test Demonstration",
  description: "Test description",
  stateId: "AL",
  projectOfficerUserId: "user-1",
  sdgDivision: "Division of System Reform Demonstrations",
} as const;

type UseMutationTuple = ReturnType<typeof useMutation>;

describe("useCreateDemonstration", () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(useMutation).mockReturnValue([
      mockCreateDemonstration,
      { loading: false },
    ] as unknown as UseMutationTuple);
  });

  it("configures the create mutation", () => {
    renderHook(() => useCreateDemonstration({ onSuccess }));

    expect(useMutation).toHaveBeenCalledExactlyOnceWith(CREATE_DEMONSTRATION_MUTATION);
  });

  it("returns the mutation loading state as saving", () => {
    vi.mocked(useMutation).mockReturnValue([
      mockCreateDemonstration,
      { loading: true },
    ] as unknown as UseMutationTuple);

    const { result } = renderHook(() => useCreateDemonstration({ onSuccess }));

    expect(result.current.saving).toBe(true);
  });

  it("submits the create mutation, refetches the demonstrations page, and shows success", async () => {
    mockCreateDemonstration.mockResolvedValue({
      data: { createDemonstration: { id: "demo-1" } },
    });

    const { result } = renderHook(() => useCreateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_INPUT);

    expect(mockCreateDemonstration).toHaveBeenCalledExactlyOnceWith({
      variables: {
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
    mockCreateDemonstration.mockResolvedValue({ errors });

    const { result } = renderHook(() => useCreateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_INPUT);

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
      "Your demonstration was not created because of an unknown problem."
    );
    expect(console.error).toHaveBeenCalledExactlyOnceWith(errors);
  });

  it("shows an error when the mutation throws", async () => {
    const error = new Error("request failed");
    mockCreateDemonstration.mockRejectedValue(error);

    const { result } = renderHook(() => useCreateDemonstration({ onSuccess }));

    await result.current.onSubmit(DEMONSTRATION_INPUT);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
      "Your demonstration was not created because of an unknown problem."
    );
    expect(console.error).toHaveBeenCalledExactlyOnceWith("Create Demonstration failed:", error);
  });
});
