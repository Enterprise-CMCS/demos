import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectUSAStates } from "./SelectUSAStates";

describe("<SelectUSAStates />", () => {
  it("filters options by input and calls onStateChange with the abbrev", async () => {
    const onStateChange = vi.fn();
    render(<SelectUSAStates onSelect={onStateChange} isRequired={false} isDisabled={false} />);

    // Open the dropdown and type a substring unique to one state
    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "ver");

    // It should show “Vermont” (unique match for "ver")
    expect(screen.getByText("Vermont")).toBeInTheDocument();

    // Select it
    await userEvent.click(screen.getByText("Vermont"));

    // Should call back with “VT”
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith("VT");
  });

  it("shows 'No matches found' when filter yields nothing", async () => {
    render(<SelectUSAStates onSelect={() => {}} />);

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "zzz");

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("applies the required and disabled props to the input", () => {
    render(<SelectUSAStates onSelect={() => {}} isRequired={true} isDisabled={true} />);

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
