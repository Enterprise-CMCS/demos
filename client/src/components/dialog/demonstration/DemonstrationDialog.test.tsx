import React, { act } from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { DemonstrationDialog, useDateValidation } from "./DemonstrationDialog";

const DEFAULT_DEMONSTRATION = {
  name: "",
  effectiveDate: "",
  expirationDate: "",
  description: "",
  stateId: "",
  projectOfficerId: "",
};

const DEFAULT_PROPS = {
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  initialDemonstration: DEFAULT_DEMONSTRATION,
  mode: "create" as const,
};


// Test ID constants
const SUBMIT_BUTTON_TEST_ID = "button-submit-demonstration-dialog";
const CANCEL_BUTTON_TEST_ID = "button-cancel-demonstration-dialog";
const DESCRIPTION_TEXTAREA_TEST_ID = "textarea-description";
const TITLE_INPUT_TEST_ID = "input-demonstration-title";
const STATE_SELECT_TEST_ID = "select-us-state";
const SELECT_USERS_TEST_ID = "select-users";
const EFFECTIVE_DATE_INPUT_TEST_ID = "input-effective-date";
const EXPIRATION_DATE_INPUT_TEST_ID = "input-expiration-date";
const SDG_DIVISION_SELECT_TEST_ID = "sdg-division-select";
const SIGNATURE_LEVEL_SELECT_TEST_ID = "signature-level-select";

describe("DemonstrationDialog", () => {
  const GET_USER_SELECT_OPTIONS_MOCK = {
    request: {
      query: GET_USER_SELECT_OPTIONS_QUERY,
    },
    result: {
      data: {
        people: [
          {
            id: "test-officer-id",
            fullName: "Test Officer",
            personType: "demos-cms-user",
          },
        ],
      },
    },
  };

  const getDemonstrationDialog = (mode: "create" | "edit" = "create") => {
    return (
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} mode={mode} />
      </TestProvider>
    );
  };

  it("renders dialog title for create mode", () => {
    render(getDemonstrationDialog("create"));
    expect(screen.getByText(/New Demonstration/i)).toBeInTheDocument();
  });

  it("renders dialog title for edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByText(/Edit Demonstration/i)).toBeInTheDocument();
  });

  it("renders the Cancel and Submit buttons", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(CANCEL_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it("disables Submit button if required fields are empty", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDisabled();
  });

  it("renders the description textarea", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(DESCRIPTION_TEXTAREA_TEST_ID)).toBeInTheDocument();
  });

  it("renders title input field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(TITLE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders state select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(STATE_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders project officer select field", async () => {
    render(getDemonstrationDialog());

    await waitFor(() => {
      expect(screen.getByTestId(SELECT_USERS_TEST_ID)).toBeInTheDocument();
    });
  });

  it("renders SDG division select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SDG_DIVISION_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders signature level select field", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId(SIGNATURE_LEVEL_SELECT_TEST_ID)).toBeInTheDocument();
  });

  it("renders effective date field in edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByTestId(EFFECTIVE_DATE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders expiration date field in edit mode", () => {
    render(getDemonstrationDialog("edit"));
    expect(screen.getByTestId(EXPIRATION_DATE_INPUT_TEST_ID)).toBeInTheDocument();
  });

  it("renders the description textarea", () => {
    render(getDemonstrationDialog());
    expect(screen.getByTestId("textarea-description")).toBeInTheDocument();
  });
});

describe("useDateValidation", () => {
  it("should initialize with empty expiration error", () => {
    const { result } = renderHook(() => useDateValidation());

    expect(result.current.expirationError).toBe("");
  });

  it("should clear expiration date when effective date is after expiration", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetEffectiveDate = vi.fn();
    const mockSetExpirationDate = vi.fn();

    // Test: effective date is after current expiration date
    result.current.handleEffectiveDateChange(
      "2024-07-01", // new effective date
      "2024-06-15", // existing expiration date (before effective)
      mockSetEffectiveDate,
      mockSetExpirationDate
    );

    expect(mockSetEffectiveDate).toHaveBeenCalledWith("2024-07-01");
    expect(mockSetExpirationDate).toHaveBeenCalledWith(""); // Should clear expiration date
  });

  it("should not clear expiration date when effective date is before expiration", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetEffectiveDate = vi.fn();
    const mockSetExpirationDate = vi.fn();

    // Test: effective date is before expiration date (valid)
    result.current.handleEffectiveDateChange(
      "2024-06-01", // new effective date
      "2024-07-15", // existing expiration date (after effective)
      mockSetEffectiveDate,
      mockSetExpirationDate
    );

    expect(mockSetEffectiveDate).toHaveBeenCalledWith("2024-06-01");
    expect(mockSetExpirationDate).not.toHaveBeenCalled(); // Should not clear expiration date
  });

  it("should set error when expiration date is before effective date", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: expiration date before effective date (invalid)
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-05-15", // expiration date
        "2024-06-01", // effective date (after expiration)
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("Expiration Date cannot be before Effective Date.");
    expect(mockSetExpirationDate).not.toHaveBeenCalled();
  });

  it("should clear error and set date when expiration date is after effective date", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: expiration date after effective date (valid)
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-07-15", // expiration date
        "2024-06-01", // effective date (before expiration)
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("");
    expect(mockSetExpirationDate).toHaveBeenCalledWith("2024-07-15");
  });

  it("should allow expiration date when no effective date is set", () => {
    const { result } = renderHook(() => useDateValidation());

    const mockSetExpirationDate = vi.fn();

    // Test: no effective date set
    act(() => {
      result.current.handleExpirationDateChange(
        "2024-07-15", // expiration date
        "", // no effective date
        mockSetExpirationDate
      );
    });

    expect(result.current.expirationError).toBe("");
    expect(mockSetExpirationDate).toHaveBeenCalledWith("2024-07-15");
  });
});
