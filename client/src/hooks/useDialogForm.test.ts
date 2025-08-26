import { vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { createFormDataWithDates, createSuccessMessages, useDialogForm } from "./useDialogForm";

// Mock the toast context
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

describe("useDialogForm", () => {
  const defaultProps = {
    mode: "add" as const,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    validateForm: vi.fn(() => true),
    getFormData: vi.fn(() => ({ test: "data" })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() => useDialogForm(defaultProps));

    expect(result.current.formStatus).toBe("idle");
    expect(result.current.showWarning).toBe(false);
    expect(result.current.showCancelConfirm).toBe(false);
    expect(result.current.isFormPending).toBe(false);
  });

  it("should handle successful form submission", async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();
    const mockValidateForm = vi.fn(() => true);
    const mockGetFormData = vi.fn(() => ({ test: "data" }));

    const { result } = renderHook(() =>
      useDialogForm({
        ...defaultProps,
        onSubmit: mockOnSubmit,
        onClose: mockOnClose,
        validateForm: mockValidateForm,
        getFormData: mockGetFormData,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockGetFormData).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalledWith({ test: "data" });
    expect(mockShowSuccess).toHaveBeenCalledWith("Created successfully!");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle form validation failure", async () => {
    const mockValidateForm = vi.fn(() => false);

    const { result } = renderHook(() =>
      useDialogForm({
        ...defaultProps,
        validateForm: mockValidateForm,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(result.current.showWarning).toBe(true);
    expect(mockShowError).toHaveBeenCalledWith("Please complete all required fields.");
  });

  it("should handle submission error", async () => {
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error("Test error"));

    const { result } = renderHook(() =>
      useDialogForm({
        ...defaultProps,
        onSubmit: mockOnSubmit,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockShowError).toHaveBeenCalledWith("Failed to save. Please try again.");
    expect(result.current.formStatus).toBe("idle");
  });

  it("should use correct success message for edit mode", async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDialogForm({
        ...defaultProps,
        mode: "edit",
        onSubmit: mockOnSubmit,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Updated successfully!");
  });

  it("should allow custom success and error messages", async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const customSuccessMessage = {
      add: "Custom created!",
      edit: "Custom updated!",
    };
    const customErrorMessage = "Custom error!";

    const { result } = renderHook(() =>
      useDialogForm({
        ...defaultProps,
        onSubmit: mockOnSubmit,
        successMessage: customSuccessMessage,
        errorMessage: customErrorMessage,
      })
    );

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Custom created!");
  });
});

describe("createFormDataWithDates", () => {
  it("should add dates to base data when provided", () => {
    const baseData = { name: "test", id: 1 };
    const result = createFormDataWithDates(baseData, "2024-06-01", "2024-07-01");

    expect(result).toEqual({
      name: "test",
      id: 1,
      effectiveDate: new Date("2024-06-01"),
      expirationDate: new Date("2024-07-01"),
    });
  });

  it("should handle missing dates gracefully", () => {
    const baseData = { name: "test" };
    const result = createFormDataWithDates(baseData);

    expect(result).toEqual({ name: "test" });
  });

  it("should handle partial dates", () => {
    const baseData = { name: "test" };
    const result = createFormDataWithDates(baseData, "2024-06-01");

    expect(result).toEqual({
      name: "test",
      effectiveDate: new Date("2024-06-01"),
    });
  });
});

describe("createSuccessMessages", () => {
  it("should create success message object", () => {
    const result = createSuccessMessages("Added!", "Updated!");

    expect(result).toEqual({
      add: "Added!",
      edit: "Updated!",
    });
  });
});
