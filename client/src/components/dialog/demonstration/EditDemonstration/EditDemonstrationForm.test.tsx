import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL,
  DEMONSTRATION_DIALOG_DESCRIPTION_NAME,
  EditDemonstrationForm,
  EditDemonstrationFormData,
} from "./EditDemonstrationForm";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { EXPIRATION_DATE_ERROR_MESSAGE, getRequiredFieldWhenApprovedMessage } from "util/messages";
import { TestProvider } from "test-utils/TestProvider";

const DEMONSTRATION: EditDemonstrationFormData = {
  name: "Existing Demonstration",
  description: "Existing description",
  stateId: "AL",
  sdgDivision: "Division of System Reform Demonstrations",
  signatureLevel: "OA",
  projectOfficerUserId: "current-user-id",
  effectiveDate: "2024-06-01",
  expirationDate: "2025-06-01",
};

const GET_USER_SELECT_OPTIONS_MOCK = {
  request: {
    query: GET_USER_SELECT_OPTIONS_QUERY,
  },
  result: {
    data: {
      people: [
        {
          id: "current-user-id",
          fullName: "Current User",
          personType: "demos-cms-user",
        },
        {
          id: "user-2",
          fullName: "Test Officer",
          personType: "demos-cms-user",
        },
      ],
    },
  },
};

const renderForm = ({
  setDemonstration = vi.fn(),
  demonstration = DEMONSTRATION,
  isApproved = false,
}: {
  setDemonstration?: React.Dispatch<React.SetStateAction<EditDemonstrationFormData>>;
  demonstration?: EditDemonstrationFormData;
  isApproved?: boolean;
} = {}) => {
  render(
    <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
      <EditDemonstrationForm
        demonstration={demonstration}
        setDemonstration={setDemonstration}
        isApproved={isApproved}
      />
    </TestProvider>
  );

  return { setDemonstration };
};

describe("EditDemonstrationForm", () => {
  it("renders the expected fields", async () => {
    renderForm();

    expect(screen.getByTestId("select-us-state")).toBeInTheDocument();
    expect(screen.getByTestId("input-demonstration-title")).toBeInTheDocument();
    expect(await screen.findByTestId("select-users")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-effective-date")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-expiration-date")).toBeInTheDocument();
    expect(screen.getByTestId(DEMONSTRATION_DIALOG_DESCRIPTION_NAME)).toBeInTheDocument();
    expect(screen.getByTestId("sdg-division-select")).toBeInTheDocument();
    expect(screen.getByTestId("signature-level-select")).toBeInTheDocument();
  });

  it("disables the state and signature level fields", () => {
    renderForm();

    expect(screen.getByTestId("select-us-state")).toBeDisabled();
    expect(screen.getByLabelText(/Signature Level/i)).toBeDisabled();
    expect(screen.getByLabelText(/Signature Level/i)).toHaveValue(
      DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL
    );
  });

  it("updates name when the title field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("input-demonstration-title"), {
      target: { value: "Updated Demonstration" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      name: "Updated Demonstration",
    });
  });

  it("updates projectOfficerUserId when the project officer field changes", async () => {
    const user = userEvent.setup();
    const { setDemonstration } = renderForm();

    await waitFor(() => expect(screen.getByTestId("select-users")).toBeInTheDocument());

    await user.click(screen.getByTestId("select-users"));
    await user.click(screen.getByRole("button", { name: "Test Officer" }));

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      projectOfficerUserId: "user-2",
    });
  });

  it("updates effectiveDate when the effective date field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("datepicker-effective-date"), {
      target: { value: "2024-07-01" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      effectiveDate: "2024-07-01",
    });
  });

  it("updates expirationDate when the expiration date field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("datepicker-expiration-date"), {
      target: { value: "2025-07-01" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      expirationDate: "2025-07-01",
    });
  });

  it("updates description when the description field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId(DEMONSTRATION_DIALOG_DESCRIPTION_NAME), {
      target: { value: "Updated description" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      description: "Updated description",
    });
  });

  it("updates sdgDivision when the SDG division field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("sdg-division-select"), {
      target: { value: "Division of Eligibility and Coverage Demonstrations" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      sdgDivision: "Division of Eligibility and Coverage Demonstrations",
    });
  });

  it("shows approved-field validation messages when required approved fields are missing", () => {
    renderForm({
      isApproved: true,
      demonstration: {
        ...DEMONSTRATION,
        sdgDivision: undefined,
        effectiveDate: undefined,
        expirationDate: undefined,
      },
    });

    expect(
      screen.getByText(getRequiredFieldWhenApprovedMessage("Effective Date"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(getRequiredFieldWhenApprovedMessage("Expiration Date"))
    ).toBeInTheDocument();
    expect(
      screen.getByText(getRequiredFieldWhenApprovedMessage("SDG Division"))
    ).toBeInTheDocument();
  });

  it("shows an error when expiration date is before effective date", () => {
    renderForm({
      isApproved: true,
      demonstration: {
        ...DEMONSTRATION,
        effectiveDate: "2025-06-01",
        expirationDate: "2024-06-01",
      },
    });

    expect(screen.getByText(EXPIRATION_DATE_ERROR_MESSAGE)).toBeInTheDocument();
  });
});
