// client/src/components/select/SelectUSStates.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectUSStates } from "./SelectUSStates";

// Mock the JSON import
vi.mock(
  "faker_data/states_territories.json",
  () => ({
    default: [
      { name: "Maryland", abbrev: "MD" },
      { name: "California", abbrev: "CA" },
      { name: "Texas", abbrev: "TX" },
    ]
  })
);

describe("<SelectUSStates />", () => {
  it("filters options by input and calls onStateChange with the abbrev", async () => {
    const onStateChange = vi.fn();
    render(
      <SelectUSStates
        onStateChange={onStateChange}
        isRequired={false}
        disabled={false}
      />
    );

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "ma");

    expect(screen.getByText("Maryland")).toBeInTheDocument();
    expect(screen.queryByText("California")).toBeNull();
    expect(screen.queryByText("Texas")).toBeNull();

    await userEvent.click(screen.getByText("Maryland"));

    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith("MD");
  });

  it("shows 'No matches found' when filter yields nothing", async () => {
    render(<SelectUSStates onStateChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "zzz");

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("applies the required and disabled props to the input", () => {
    render(
      <SelectUSStates
        onStateChange={() => {}}
        isRequired={true}
        disabled={true}
      />
    );

    const input = screen.getByRole("textbox", { name: /state or territory/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
