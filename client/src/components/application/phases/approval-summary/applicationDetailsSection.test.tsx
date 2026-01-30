import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";

import {
  ApplicationDetailsSection,
  ApplicationDetailsFormData,
} from "./applicationDetailsSection";


type SelectUSAStatesProps = {
  label: string;
  value: string;
  onSelect: (state: string) => void;
};

vi.mock("components/input/select/SelectUSAStates", () => ({
  SelectUSAStates: ({ label, value, onSelect }: SelectUSAStatesProps) => (
    <div>
      <label>{label}</label>
      <button onClick={() => onSelect("NY")}>Select NY</button>
      <span>{value}</span>
    </div>
  ),
}));

describe("ApplicationDetailsSection", () => {
  const mockSetSectionFormData = vi.fn();
  const mockOnMarkComplete = vi.fn();

  const baseFormData: ApplicationDetailsFormData = {
    stateId: "",
    stateName: "",
    name: "",
    projectOfficerName: "",
    projectOfficerId: "",
    status: "",
    effectiveDate: undefined,
    expirationDate: undefined,
    description: undefined,
    sdgDivision: undefined,
    signatureLevel: undefined,
    readonlyFields: {},
  };

  const setup = (
    overrides?: Partial<ApplicationDetailsFormData>,
    isComplete = false,
    isReadonly = false
  ) => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ApplicationDetailsSection
          sectionFormData={{ ...baseFormData, ...overrides }}
          setSectionFormData={mockSetSectionFormData}
          isComplete={isComplete}
          isReadonly={isReadonly}
          onMarkComplete={mockOnMarkComplete}
        />
      </MockedProvider>
    );
  };

  const expandTypesSection = async () => {
    const toggle = screen.getByRole("button", {
      name: /details, complete, expand section/i,
    });
    await userEvent.click(toggle);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section title and description", () => {
    setup();

    expect(screen.getByText("Application Details")).toBeInTheDocument();
    expect(
      screen.getByText(/Confirm all demonstration information/i)
    ).toBeInTheDocument();
  });

  it("renders editable input when field is not readonly", () => {
    setup({
      name: "Demo",
      readonlyFields: {},
    });

    const input = screen.getByLabelText(/demonstration title/i);
    expect(input).toBeEnabled();
  });

  it("renders static value when field is marked readonly", () => {
    setup({
      name: "Readonly Demo",
      readonlyFields: { name: true },
    });

    expect(screen.getByText("Readonly Demo")).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/demonstration title/i)
    ).not.toBeInTheDocument();
  });

  it("enables Mark Complete button when required fields are filled", () => {
    setup({
      stateId: "CA",
      name: "Demo",
      projectOfficerId: "Officer",
      projectOfficerName: "Officer",
      status: "Active",
      effectiveDate: "2025-01-01",
      expirationDate: "2026-01-01",
      sdgDivision: "Division of System Reform Demonstrations",
      signatureLevel: "OA",
    });

    const button = screen.getByTestId("application-details-mark-complete");
    expect(button).toBeEnabled();
  });

  it("disables Mark Complete button when section is complete", async () => {
    setup(
      {
        stateId: "CA",
        name: "Demo",
        projectOfficerId: "Officer",
        projectOfficerName: "Officer",
        status: "Active",
        effectiveDate: "2025-01-01",
        expirationDate: "2026-01-01",
        sdgDivision: "Division of System Reform Demonstrations",
        signatureLevel: "OA",
      },
      true,  // isComplete
      false
    );

    await expandTypesSection();

    const button = screen.getByTestId("application-details-mark-complete");
    expect(button).toBeDisabled();

    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("calls onMarkComplete when Mark Complete is clicked", async () => {
    setup({
      stateId: "CA",
      name: "Demo",
      projectOfficerId: "Officer",
      projectOfficerName: "Officer",
      status: "Active",
      effectiveDate: "2025-01-01",
      expirationDate: "2026-01-01",
      sdgDivision: "Division of System Reform Demonstrations",
      signatureLevel: "OA",
    });

    const button = screen.getByTestId("application-details-mark-complete");
    await userEvent.click(button);

    expect(mockOnMarkComplete).toHaveBeenCalledOnce();
  });
});
