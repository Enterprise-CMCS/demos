import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DemonstrationTypeField, SELECT_DEMONSTRATION_TYPE_NAME } from "./DemonstrationTypeField";
import { Tag } from "demos-server";

const MOCK_OPTIONS: Tag[] = [
  { tagName: "Aggregate Cap", approvalStatus: "Approved" },
  { tagName: "Annual Limits", approvalStatus: "Unapproved" },
  { tagName: "Basic Health Plan (BHP)", approvalStatus: "Approved" },
];

describe("DemonstrationTypeField", () => {
  const setup = ({
    options = MOCK_OPTIONS,
    selectedValues = [],
    onSelect = vi.fn(),
    isRequired = false,
  } = {}) => {
    render(
      <DemonstrationTypeField
        demonstrationTypeTags={options}
        selectedValues={selectedValues}
        onSelect={onSelect}
        isRequired={isRequired}
      />
    );
    return { onSelect };
  };

  it("renders the label", () => {
    setup();

    expect(screen.getByLabelText(/Demonstration Type/i)).toBeInTheDocument();
  });

  it("does not show the required indicator by default", () => {
    setup();

    expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).not.toBeRequired();
  });

  it("shows the required indicator when isRequired is true", () => {
    setup({ isRequired: true });

    expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).toBeRequired();
  });

  it("renders with placeholder text", () => {
    setup();

    expect(screen.getByPlaceholderText("Select demonstration type…")).toBeInTheDocument();
  });

  it("shows all options when opened", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME));

    MOCK_OPTIONS.forEach((option) => {
      expect(screen.getByText(option.tagName)).toBeInTheDocument();
    });
  });

  it("calls onSelect with the selected value when an option is chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();

    await user.click(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME));
    await user.click(screen.getByText("Aggregate Cap"));

    expect(onSelect).toHaveBeenCalledWith(["Aggregate Cap"]);
  });

  it("calls onSelect with multiple values when multiple options are chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();

    await user.click(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME));
    await user.click(screen.getByText("Aggregate Cap"));
    await user.click(screen.getByText("Annual Limits"));

    expect(onSelect).toHaveBeenLastCalledWith(["Aggregate Cap", "Annual Limits"]);
  });

  it("filters options as the user types", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME), "Annual");

    expect(screen.getByText("Annual Limits")).toBeInTheDocument();
    expect(screen.queryByText("Aggregate Cap")).not.toBeInTheDocument();
  });

  it("shows no options message when type-ahead produces no matches", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME), "zzz");

    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });
});
