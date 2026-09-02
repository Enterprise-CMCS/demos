import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "components/user/UserContext";

import { ApplicationDetailsSection, ApplicationDetailsFormData } from "./ApplicationDetailsSection";
import { LocalDate } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import { readonlyMockUser } from "mock-data/userMocks";

describe("ApplicationDetailsSection", () => {
  const mockSetSectionFormData = vi.fn();
  const mockOnMarkComplete = vi.fn();

  const baseFormData: ApplicationDetailsFormData = {
    applicationType: "demonstration",
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
    staticFields: {},
  };

  const setup = (
    overrides?: Partial<ApplicationDetailsFormData>,
    isComplete = false,
    isDemonstrationApproved = false,
    currentUser?: CurrentUser
  ) => {
    render(
      <TestProvider mocks={[]} currentUser={currentUser}>
        <ApplicationDetailsSection
          sectionFormData={{ ...baseFormData, ...overrides }}
          setSectionFormData={mockSetSectionFormData}
          isComplete={isComplete}
          isDemonstrationApproved={isDemonstrationApproved}
          onMarkComplete={mockOnMarkComplete}
          onMarkIncomplete={vi.fn()}
        />
      </TestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders section title and description", () => {
    setup();

    expect(screen.getByText("Application Details")).toBeInTheDocument();
    expect(screen.getByText(/Confirm all demonstration information/i)).toBeInTheDocument();
  });

  it("shows 'demonstration' text for demonstration", () => {
    setup();

    expect(screen.getByText(/confirm all demonstration information/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/demonstration title/i)).toBeInTheDocument();
  });

  it("renders editable input when field is not static", () => {
    setup({
      name: "Demo",
      staticFields: {},
    });

    const input = screen.getByLabelText(/demonstration title/i);
    expect(input).toBeEnabled();
  });

  it("renders static value when field is marked static", () => {
    setup({
      name: "Static Demo",
      staticFields: { name: true },
    });

    expect(screen.getByText("Static Demo")).toBeInTheDocument();
    expect(screen.queryByLabelText(/demonstration title/i)).not.toBeInTheDocument();
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
      applicationApprovalDate: "2025-06-01" as LocalDate,
    });

    const toggle = screen.getByRole("switch", { name: /mark complete/i });
    expect(toggle).toBeEnabled();
  });

  it("keeps Mark Complete toggle enabled when section is complete for marking incomplete", async () => {
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
      true, // isComplete
      false
    );
    const user = userEvent.setup();

    const headerButton = screen.getByRole("button", {
      name: /Application Details, complete, expand section/i,
    });
    await user.click(headerButton);

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
      applicationApprovalDate: "2025-06-01" as LocalDate,
    });

    const toggle = screen.getByRole("switch", { name: /mark complete/i });
    await userEvent.click(toggle);

    expect(mockOnMarkComplete).toHaveBeenCalledOnce();
  });

  describe("Amendment and Extension behavior", () => {
    it("shows 'amendment' text for amendment", () => {
      setup({
        applicationType: "amendment",
        name: "Amendment 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
      } as ApplicationDetailsFormData);

      expect(screen.getByText(/confirm all amendment information/i)).toBeInTheDocument();

      expect(screen.getByLabelText(/amendment title/i)).toBeInTheDocument();
    });

    it("does not render demonstration-only fields for amendment", () => {
      setup({
        applicationType: "amendment",
        name: "Amendment 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
      } as ApplicationDetailsFormData);

      expect(screen.queryByText(/state\/territory/i)).not.toBeInTheDocument();

      expect(screen.queryByText(/project officer/i)).not.toBeInTheDocument();

      expect(screen.queryByText(/sdg division/i)).not.toBeInTheDocument();
    });

    it("enables Mark Complete for amendment with minimal required fields", () => {
      setup({
        applicationType: "amendment",
        name: "Amendment 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
        applicationApprovalDate: "2025-06-01",
      } as ApplicationDetailsFormData);

      const toggle = screen.getByRole("switch", { name: /mark complete/i });
      expect(toggle).toBeEnabled();
    });

    it("disables Mark Complete for amendment when required fields missing", () => {
      setup({
        applicationType: "amendment",
        name: "Amendment 1",
        // missing effectiveDate + signatureLevel
        staticFields: {},
      } as ApplicationDetailsFormData);

      const toggle = screen.getByRole("switch", { name: /mark complete/i });
      expect(toggle).toBeDisabled();
    });

    it("capitalizes application type in labels", () => {
      setup({
        applicationType: "extension",
        name: "Extension 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
      } as ApplicationDetailsFormData);

      expect(screen.getByLabelText(/extension title/i)).toBeInTheDocument();
    });

    it("renders application approval date field for demonstrations", () => {
      setup({
        applicationType: "demonstration",
        name: "Demo",
        stateId: "CA",
        projectOfficerId: "Officer",
        projectOfficerName: "Officer",
        status: "Active",
        effectiveDate: "2025-01-01",
        expirationDate: "2026-01-01",
        sdgDivision: "Division of System Reform Demonstrations",
        signatureLevel: "OA",
        staticFields: {},
        applicationApprovalDate: "2025-06-01" as LocalDate,
      } as ApplicationDetailsFormData);

      expect(screen.getByLabelText(/application approval date/i)).toBeInTheDocument();
    });

    it("renders application approval date field for both amendments and extensions", () => {
      setup({
        applicationType: "amendment",
        name: "Amendment 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
        applicationApprovalDate: "2025-06-01",
      } as ApplicationDetailsFormData);

      expect(screen.getByLabelText(/application approval date/i)).toBeInTheDocument();

      setup({
        applicationType: "extension",
        name: "Extension 1",
        effectiveDate: "2025-01-01",
        signatureLevel: "OA",
        staticFields: {},
        applicationApprovalDate: "2025-06-01",
      } as ApplicationDetailsFormData);

      expect(screen.getByLabelText(/application approval date/i)).toBeInTheDocument();
    });
  });

  describe("Readonly User Behavior", () => {
    it("disables all editable fields and hides mark complete for readonly users", () => {
      setup(
        {
          applicationType: "demonstration",
          stateId: "CA",
          stateName: "California",
          staticFields: {},
        },
        false,
        false,
        readonlyMockUser
      );

      // Check that all editable inputs are disabled
      expect(screen.getByLabelText(/demonstration title/i)).toBeDisabled();
      expect(screen.getByLabelText(/status/i)).toBeDisabled();
      expect(screen.getByLabelText(/effective date/i)).toBeDisabled();
      expect(screen.getByLabelText(/expiration date/i)).toBeDisabled();
      expect(screen.getByLabelText(/demonstration description/i)).toBeDisabled();
      expect(screen.getByLabelText(/signature level/i)).toBeDisabled();
      expect(screen.getByLabelText(/application approval date/i)).toBeDisabled();

      // Check that Mark Complete switch is hidden
      expect(screen.queryByRole("switch", { name: /mark complete/i })).not.toBeInTheDocument();
    });
  });
});
