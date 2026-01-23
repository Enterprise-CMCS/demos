import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTypesSection } from "./demonstrationTypesSection";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { TestProvider } from "test-utils/TestProvider";

const mockTypes: DemonstrationDetailDemonstrationType[] = [
  {
    demonstrationType: "Environmental",
    status: "Active",
    effectiveDate: new Date("2023-01-01"),
    expirationDate: new Date("2024-01-01"),
  },
  {
    demonstrationType: "Economic",
    status: "Inactive",
    effectiveDate: new Date("2024-01-01"),
    expirationDate: new Date("2025-01-01"),
  },
];

describe("DemonstrationTypesSection", () => {
  let onMarkComplete: (complete: boolean) => void;

  const setup = (isComplete = false, types = mockTypes) => {
    onMarkComplete = vi.fn();

    render(
      <TestProvider>
        <DemonstrationTypesSection
          initialTypes={types}
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

  it("switch reflects initial complete state", () => {
    setup(true);

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
});
