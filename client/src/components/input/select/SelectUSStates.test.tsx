// client/src/components/select/SelectUSStates.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectUSStates } from "./SelectUSStates";

// 1) Mock your JSON import so tests run fast with a small list
jest.mock(
  "faker_data/states_territories.json",
  () => [
    { name: "Maryland", abbrev: "MD" },
    { name: "California", abbrev: "CA" },
    { name: "Texas", abbrev: "TX" },
  ],
  { virtual: true }
);

describe("<SelectUSStates />", () => {
  it("filters options by input and calls onStateChange with the abbrev", async () => {
    const onStateChange = jest.fn();
    render(
      <SelectUSStates
        onStateChange={onStateChange}
        isRequired={false}
        disabled={false}
      />
    );

    // Focus the input and type "ma" → should match "Maryland"
    const input = screen.getByRole("textbox", { name: /us state or territory/i });
    await userEvent.click(input);
    await userEvent.type(input, "ma");

    // The list should show "Maryland" but not "California" or "Texas"
    expect(screen.getByText("Maryland")).toBeInTheDocument();
    expect(screen.queryByText("California")).toBeNull();
    expect(screen.queryByText("Texas")).toBeNull();

    // Click the match
    await userEvent.click(screen.getByText("Maryland"));

    // Callback should have been called once with "MD"
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith("MD");
  });

  it("shows 'No matches found' when filter yields nothing", async () => {
    render(<SelectUSStates onStateChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: /us state or territory/i });
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

    const input = screen.getByRole("textbox", { name: /us state or territory/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
