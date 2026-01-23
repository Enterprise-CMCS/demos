import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApprovalSummaryPhase } from "./ApprovalSummaryPhase";
import { ApplicationDetailsFormData } from "./applicationDetailsSection";
import { TestProvider } from "test-utils/TestProvider";

const buildInitialFormData = (
  overrides?: Partial<ApplicationDetailsFormData>
): ApplicationDetailsFormData => ({
  stateId: "CA",
  stateName: "California",
  name: "Test Demonstration",
  projectOfficerId: "user-123",
  projectOfficerName: "Jane Doe",
  status: "Active",
  effectiveDate: "2025-01-01",
  expirationDate: "2026-01-01",
  description: "Test description",
  sdgDivision: "Division of System Reform Demonstrations",
  signatureLevel: "OA",
  readonlyFields: {},
  ...overrides,
});

describe("ApprovalSummaryPhase", () => {
  const setup = (formData = buildInitialFormData()) => {
    render(
      <TestProvider>
        <ApprovalSummaryPhase initialFormData={formData} />
      </TestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header and description", () => {
    setup();

    expect(screen.getByText("Approval Summary")).toBeInTheDocument();
    expect(screen.getByText("Approval Summary Description")).toBeInTheDocument();
  });

  it("renders Application Details section", () => {
    setup();

    expect(screen.getByText("Application Details")).toBeInTheDocument();
  });

  it("initially shows application details section as incomplete", () => {
    setup();

    const section = screen.getByText("Application Details").closest("section");
    expect(within(section!).getByText("Incomplete")).toBeInTheDocument();
  });

  it("marks Application Details section as complete after clicking Mark Complete", async () => {
    setup();

    const button = screen.getByTestId("application-details-mark-complete");
    await userEvent.click(button);

    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("renders Demonstration Types section", () => {
    setup();

    const section = screen.getByText("Types").closest("section");
    expect(section).toBeInTheDocument();

    expect(within(section!).getByText("Incomplete")).toBeInTheDocument();
  });
});
