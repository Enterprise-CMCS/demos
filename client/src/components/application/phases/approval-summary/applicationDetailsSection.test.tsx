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

type SelectUsersProps = {
  label: string;
  value: string;
  onSelect: (userId: string) => void;
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

vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({ label, value, onSelect }: SelectUsersProps) => (
    <div>
      <label>{label}</label>
      <p>Loading...</p>
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
      <MockedProvider mocks={[]}>
        <ApplicationDetailsSection
          sectionFormData={{ ...baseFormData, ...overrides }}
          setSectionFormData={mockSetSectionFormData}
          isComplete={isComplete}
          isReadonly={isReadonly}
          onMarkComplete={mockOnMarkComplete}
          onMarkIncomplete={vi.fn()}
        />
      </MockedProvider>
    );
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

  it("enables Mark Complete toggle when required fields are filled", () => {
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

    const toggle = screen.getByRole("switch", { name: /mark complete/i });
    expect(toggle).toBeEnabled();
  });

  it("keeps Mark Complete toggle enabled when section is complete for marking incomplete", () => {
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

    const toggle = screen.getByRole("switch", { name: /mark complete/i });
    expect(toggle).toBeEnabled();
  });

  it("calls onMarkComplete when Mark Complete toggle is turned on", async () => {
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

    const toggle = screen.getByRole("switch", { name: /mark complete/i });
    await userEvent.click(toggle);

    expect(mockOnMarkComplete).toHaveBeenCalledOnce();
  });
});
