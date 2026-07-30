import React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  CreateDemonstrationForm,
  CreateDemonstrationFormData,
  DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL,
  DEMONSTRATION_DIALOG_DESCRIPTION_NAME,
} from "./CreateDemonstrationForm";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";
import { TestProvider } from "test-utils/TestProvider";

const DEMONSTRATION: CreateDemonstrationFormData = {
  name: "",
  description: "",
  stateId: "",
  sdgDivision: undefined,
  projectOfficerUserId: "current-user-id",
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

const renderForm = (setDemonstration = vi.fn(), demonstration = DEMONSTRATION) => {
  render(
    <TestProvider mocks={[GET_USER_SELECT_OPTIONS_MOCK]}>
      <CreateDemonstrationForm demonstration={demonstration} setDemonstration={setDemonstration} />
    </TestProvider>
  );

  return { setDemonstration };
};

describe("CreateDemonstrationForm", () => {
  it("renders the expected fields", async () => {
    renderForm();

    expect(screen.getByTestId("select-us-state")).toBeInTheDocument();
    expect(screen.getByTestId("input-demonstration-title")).toBeInTheDocument();
    expect(await screen.findByTestId("select-users")).toBeInTheDocument();
    expect(screen.getByTestId(DEMONSTRATION_DIALOG_DESCRIPTION_NAME)).toBeInTheDocument();
    expect(screen.getByTestId("sdg-division-select")).toBeInTheDocument();
    expect(screen.getByTestId("signature-level-select")).toBeInTheDocument();
  });

  it("configures the signature level field as disabled with the default value", () => {
    renderForm();

    const signatureLevelSelect = screen.getByLabelText(/Signature Level/i);

    expect(signatureLevelSelect).toBeDisabled();
    expect(signatureLevelSelect).toHaveValue(DEFAULT_DEMONSTRATION_SIGNATURE_LEVEL);
  });

  it("updates stateId when the state field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.focus(screen.getByTestId("select-us-state"));
    fireEvent.click(screen.getByRole("button", { name: "Alabama" }));

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      stateId: "AL",
    });
  });

  it("updates name when the title field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("input-demonstration-title"), {
      target: { value: "New Demonstration" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      name: "New Demonstration",
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

  it("updates description when the description field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId(DEMONSTRATION_DIALOG_DESCRIPTION_NAME), {
      target: { value: "Test description" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      description: "Test description",
    });
  });

  it("updates sdgDivision when the SDG division field changes", () => {
    const { setDemonstration } = renderForm();

    fireEvent.change(screen.getByTestId("sdg-division-select"), {
      target: { value: "Division of System Reform Demonstrations" },
    });

    expect(setDemonstration).toHaveBeenCalledWith({
      ...DEMONSTRATION,
      sdgDivision: "Division of System Reform Demonstrations",
    });
  });
});
