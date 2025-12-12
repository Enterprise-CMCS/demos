import React, { act } from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, renderHook, screen, waitFor } from "@testing-library/react";
import {
  DemonstrationDialog,
  useDateValidation,
  checkFormHasChanges,
  DemonstrationDialogFields,
} from "./DemonstrationDialog";
import userEvent from "@testing-library/user-event";
import { SdgDivision, SignatureLevel } from "demos-server";

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

  it("should enable submit button when form has changes and disable when reverted", async () => {
    const user = userEvent.setup();
    const { getByTestId } = render(getDemonstrationDialog("edit"));

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const titleInput = getByTestId(TITLE_INPUT_TEST_ID);
    await user.clear(titleInput);
    await user.type(titleInput, "New Name");
    expect(submitButton).toBeEnabled();

    await user.clear(titleInput);
    expect(submitButton).toBeDisabled();
  });

  describe("checkFormChanged", () => {
    const BASE_DEMONSTRATION: DemonstrationDialogFields = {
      name: "Test Demo",
      description: "Test Description",
      stateId: "NC",
      projectOfficerId: "officer-123",
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
      sdgDivision: "Division of System Reform Demonstrations",
      signatureLevel: "OA",
    };

    it("returns false when demonstrations are identical", () => {
      const result = checkFormHasChanges(BASE_DEMONSTRATION, BASE_DEMONSTRATION);
      expect(result).toBe(false);
    });

    it("returns false when demonstrations have same values but different object references", () => {
      const copy = { ...BASE_DEMONSTRATION };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, copy);
      expect(result).toBe(false);
    });

    it("returns true when name changes", () => {
      const updated = { ...BASE_DEMONSTRATION, name: "Different Name" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when description changes", () => {
      const updated = { ...BASE_DEMONSTRATION, description: "Different Description" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when stateId changes", () => {
      const updated = { ...BASE_DEMONSTRATION, stateId: "CA" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when projectOfficerId changes", () => {
      const updated = { ...BASE_DEMONSTRATION, projectOfficerId: "officer-456" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when effectiveDate changes", () => {
      const updated = { ...BASE_DEMONSTRATION, effectiveDate: "2024-02-01" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when expirationDate changes", () => {
      const updated = { ...BASE_DEMONSTRATION, expirationDate: "2024-11-30" };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when sdgDivision changes", () => {
      const updated = {
        ...BASE_DEMONSTRATION,
        sdgDivision: "Division of Eligibility and Coverage Demonstrations" as SdgDivision,
      };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when signatureLevel changes", () => {
      const updated = { ...BASE_DEMONSTRATION, signatureLevel: "OCD" as SignatureLevel };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns true when multiple fields change", () => {
      const updated = {
        ...BASE_DEMONSTRATION,
        name: "New Name",
        description: "New Description",
        stateId: "CA",
      };
      const result = checkFormHasChanges(BASE_DEMONSTRATION, updated);
      expect(result).toBe(true);
    });

    it("returns false when empty strings remain empty", () => {
      const empty = {
        ...BASE_DEMONSTRATION,
        name: "",
        description: "",
        effectiveDate: "",
        expirationDate: "",
      };
      const result = checkFormHasChanges(empty, { ...empty });
      expect(result).toBe(false);
    });

    it("returns true when field changes from empty to non-empty", () => {
      const initial = { ...BASE_DEMONSTRATION, name: "" };
      const updated = { ...BASE_DEMONSTRATION, name: "New Name" };
      const result = checkFormHasChanges(initial, updated);
      expect(result).toBe(true);
    });

    it("returns true when field changes from non-empty to empty", () => {
      const initial = { ...BASE_DEMONSTRATION, name: "Test Name" };
      const updated = { ...BASE_DEMONSTRATION, name: "" };
      const result = checkFormHasChanges(initial, updated);
      expect(result).toBe(true);
    });
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
