import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectUSAStates } from "./SelectUSAStates";

// Provide a small, controlled set of states for this test
const { mockStates } = vi.hoisted(() => ({
  mockStates: [
    { name: "Maryland", abbrev: "MD" },
    { name: "California", abbrev: "CA" },
    { name: "Texas", abbrev: "TX" },
  ],
}));

// Mock the real data module consumed by the component
vi.mock("data/StatesAndTerritories", () => ({
  states: mockStates,
}));

describe("<SelectUSAStates />", () => {
  it("filters options by input and calls onStateChange with the abbrev", async () => {
    const onStateChange = vi.fn();
    render(
      <SelectUSAStates
        onStateChange={onStateChange}
        isRequired={false}
        isDisabled={false}
      />
    );

    // Open the dropdown and type "ma"
    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "ma");

    // Only “Maryland” should appear
    expect(screen.getByText("Maryland")).toBeInTheDocument();
    expect(screen.queryByText("California")).toBeNull();
    expect(screen.queryByText("Texas")).toBeNull();

    // Select it
    await userEvent.click(screen.getByText("Maryland"));

    // Should call back with “MD”
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith("MD");
  });

  it("shows 'No matches found' when filter yields nothing", async () => {
    render(<SelectUSAStates onStateChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "zzz");

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("applies the required and disabled props to the input", () => {
    render(
      <SelectUSAStates
        onStateChange={() => {}}
        isRequired={true}
        isDisabled={true}
      />
    );

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
