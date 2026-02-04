import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { TestProvider } from "test-utils/TestProvider";
import { ApplicationStatus } from "demos-server";

const showApplyDemonstrationTypesDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showApplyDemonstrationTypesDialog,
  }),
}));

const mockTypes: DemonstrationDetailDemonstrationType[] = [
  {
    demonstrationTypeName: "Environmental",
    status: "Active",
    effectiveDate: new Date("2023-01-01"),
    expirationDate: new Date("2024-01-01"),
    createdAt: new Date("2022-12-01"),
  },
  {
    demonstrationTypeName: "Economic",
    status: "Pending",
    effectiveDate: new Date("2024-01-01"),
    expirationDate: new Date("2025-01-01"),
    createdAt: new Date("2023-06-01"),
  },
];

const expandTypesSection = async () => {
  const toggle = screen.getByRole("button", {
    name: /types, complete, expand section/i,
  });
  await userEvent.click(toggle);
};

describe("DemonstrationTypesSection", () => {
  let onMarkComplete: (complete: boolean) => void;

  const setup = (isComplete = false, types = mockTypes) => {
    onMarkComplete = vi.fn();

    const demonstration = {
      id: "demo-123",
      status: "Active" as ApplicationStatus,
      demonstrationTypes: types,
    };

    render(
      <TestProvider>
        <DemonstrationTypesSection
          demonstration={demonstration}
          isComplete={isComplete}
          onMarkComplete={onMarkComplete}
        />
      </TestProvider>
    );
  };

  beforeEach(() => {
    onMarkComplete = vi.fn<(complete: boolean) => void>();
    vi.clearAllMocks();
  });

  it("renders section title and description", () => {
    setup();
    expect(screen.getByText("Types")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add or Update Demonstration Types with Effective and Expiration Dates below"
      )
    ).toBeInTheDocument();
  });

  it("renders the Mark Complete switch", () => {
    setup();
    expect(screen.getByText("Mark Complete")).toBeInTheDocument();

    const switchInput = screen.getByTestId("mark-complete-switch");
    expect(switchInput).toBeInTheDocument();
    expect(switchInput).not.toBeChecked();
  });

  it("switch reflects initial complete state", async () => {
    setup(true);
    await expandTypesSection();

    const switchInput = screen.getByTestId("mark-complete-switch");
    expect(switchInput).toBeChecked();
  });

  it("calls onMarkComplete when switch is toggled from incomplete to complete", async () => {
    setup(false);
    const user = userEvent.setup();

    const switchInput = screen.getByTestId("mark-complete-switch");
    await user.click(switchInput);

    expect(onMarkComplete).toHaveBeenCalledTimes(1);
    expect(onMarkComplete).toHaveBeenCalledWith(true);
  });

  it("calls onMarkComplete when switch is toggled from complete to incomplete", async () => {
    setup(true);
    const user = userEvent.setup();

    await expandTypesSection();

    const switchInput = screen.getByTestId("mark-complete-switch");
    await user.click(switchInput);

    expect(onMarkComplete).toHaveBeenCalledTimes(1);
    expect(onMarkComplete).toHaveBeenCalledWith(false);
  });

  it("disables switch when there are no types", () => {
    setup(false, []);
    const switchInput = screen.getByTestId("mark-complete-switch");
    expect(switchInput).toBeDisabled();
  });

  it("opens apply demonstration types dialog when clicking apply types button", async () => {
    const user = userEvent.setup();
    setup();

    const section = screen.getByText("Types").closest("section");
    const applyButton = within(section!).getByRole("button", { name: /apply-types/i });
    await user.click(applyButton);
    expect(showApplyDemonstrationTypesDialog).toHaveBeenCalledWith("demo-123");
  });
});
