import React, { act } from "react";

import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";

import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { DemonstrationDialog, useDateValidation } from "./DemonstrationDialog";
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

describe("DemonstrationDialog - handleChange and isChanged behavior", () => {
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
          {
            id: "initial-officer-id",
            fullName: "Initial Officer",
            personType: "demos-cms-user",
          },
        ],
      },
    },
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it("should enable/disable submit button on state change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      stateId: "NC",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const stateSelect = getByTestId(STATE_SELECT_TEST_ID);
    await user.click(stateSelect);
    await user.clear(stateSelect);
    await user.type(stateSelect, "Alabama");
    await user.click(screen.getByText("Alabama"));
    expect(submitButton).toBeEnabled();

    await user.click(stateSelect);
    await user.clear(stateSelect);
    await user.type(stateSelect, "North Carolina");
    await user.click(screen.getByText("North Carolina"));
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on name change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      name: "Original Name",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const titleInput = getByTestId(TITLE_INPUT_TEST_ID);
    await user.clear(titleInput);
    await user.type(titleInput, "New Name");
    expect(submitButton).toBeEnabled();

    await user.clear(titleInput);
    await user.type(titleInput, "Original Name");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on project officer change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      projectOfficerId: "initial-officer-id",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK, GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(SELECT_USERS_TEST_ID)).toBeInTheDocument();
    });

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const projectOfficerSelect = getByTestId(SELECT_USERS_TEST_ID);
    await user.click(projectOfficerSelect);
    await user.clear(projectOfficerSelect);
    await user.type(projectOfficerSelect, "Test Officer");
    await user.click(screen.getByText("Test Officer"));
    expect(submitButton).toBeEnabled();

    await user.click(projectOfficerSelect);
    await user.clear(projectOfficerSelect);
    await user.type(projectOfficerSelect, "Initial Officer");
    await user.click(screen.getByText("Initial Officer"));
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on effective date change in edit mode", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      effectiveDate: "2024-01-01",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} mode="edit" initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const effectiveDateInput = getByTestId(EFFECTIVE_DATE_INPUT_TEST_ID);
    await user.clear(effectiveDateInput);
    await user.type(effectiveDateInput, "2024-02-01");
    expect(submitButton).toBeEnabled();

    await user.clear(effectiveDateInput);
    await user.type(effectiveDateInput, "2024-01-01");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on expiration date change in edit mode", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} mode="edit" initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const expirationDateInput = getByTestId(EXPIRATION_DATE_INPUT_TEST_ID);
    await user.clear(expirationDateInput);
    await user.type(expirationDateInput, "2024-11-30");
    expect(submitButton).toBeEnabled();

    await user.clear(expirationDateInput);
    await user.type(expirationDateInput, "2024-12-31");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on description change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      description: "Original Description",
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const descriptionTextarea = getByTestId(DESCRIPTION_TEXTAREA_TEST_ID);
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "New Description");
    expect(submitButton).toBeEnabled();

    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "Original Description");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on sdg division change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      sdgDivision: "Division of System Reform Demonstrations" as SdgDivision,
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const sdgDivisionSelect = getByTestId(SDG_DIVISION_SELECT_TEST_ID);
    await user.selectOptions(
      sdgDivisionSelect,
      "Division of Eligibility and Coverage Demonstrations"
    );
    expect(submitButton).toBeEnabled();

    await user.selectOptions(sdgDivisionSelect, "Division of System Reform Demonstrations");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on signature level change", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      signatureLevel: "OA" as SignatureLevel,
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const signatureLevelSelect = getByTestId(SIGNATURE_LEVEL_SELECT_TEST_ID);
    await user.selectOptions(signatureLevelSelect, "OCD");
    expect(submitButton).toBeEnabled();

    await user.selectOptions(signatureLevelSelect, "OA");
    expect(submitButton).toBeDisabled();
  });

  it("should enable/disable submit button on multiple field changes", async () => {
    const initialDemo = {
      ...DEFAULT_DEMONSTRATION,
      name: "Original Name",
      description: "Original Description",
      stateId: "NC",
      sdgDivision: "Division of System Reform Demonstrations" as SdgDivision,
      signatureLevel: "OA" as SignatureLevel,
    };

    const { getByTestId } = render(
      <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
        <DemonstrationDialog {...DEFAULT_PROPS} initialDemonstration={initialDemo} />
      </TestProvider>
    );

    const submitButton = getByTestId(SUBMIT_BUTTON_TEST_ID);
    expect(submitButton).toBeDisabled();

    const titleInput = getByTestId(TITLE_INPUT_TEST_ID);
    await user.clear(titleInput);
    await user.type(titleInput, "New Name");
    expect(submitButton).toBeEnabled();

    const descriptionTextarea = getByTestId(DESCRIPTION_TEXTAREA_TEST_ID);
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "New Description");
    expect(submitButton).toBeEnabled();

    const stateSelect = getByTestId(STATE_SELECT_TEST_ID);
    await user.click(stateSelect);
    await user.clear(stateSelect);
    await user.type(stateSelect, "Alabama");
    await user.click(screen.getByText("Alabama"));
    expect(submitButton).toBeEnabled();

    await user.clear(titleInput);
    await user.type(titleInput, "Original Name");
    expect(submitButton).toBeEnabled();

    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "Original Description");
    expect(submitButton).toBeEnabled();

    await user.click(stateSelect);
    await user.clear(stateSelect);
    await user.type(stateSelect, "North Carolina");
    await user.click(screen.getByText("North Carolina"));
    expect(submitButton).toBeDisabled();
  });
});
