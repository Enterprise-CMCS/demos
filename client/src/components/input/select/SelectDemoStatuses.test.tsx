// client/src/components/select/SelectDemoStatuses.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectDemoStatuses } from "./SelectDemoStatuses";

// Mock the JSON import
vi.mock("faker_data/demonstrationStatuses.json", () => ({
  default: [
    { id: 1, name: "On Hold" },
    { id: 2, name: "Pending" },
    { id: 3, name: "Approved" },
  ],
}));

describe("<SelectDemoStatuses />", () => {
  it("filters and selects a status, calling onStatusChange with the name", async () => {
    const onStatusChange = vi.fn();
    render(
      <SelectDemoStatuses onStatusChange={onStatusChange} isRequired={false} isDisabled={false} />
    );

    // Focus and type "pe" to match "Pending"
    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "pe");

    // It should show only "Pending"
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("On Hold")).toBeNull();
    expect(screen.queryByText("Approved")).toBeNull();

    // Click "Pending"
    await userEvent.click(screen.getByText("Pending"));

    // Callback should be called once with "Pending"
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith("Pending");
  });

  it("shows 'No matches found' when nothing matches", async () => {
    render(<SelectDemoStatuses onStatusChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "xyz");

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("applies required and disabled attributes to the input", () => {
    render(<SelectDemoStatuses onStatusChange={() => {}} isRequired={true} isDisabled={true} />);

    const input = screen.getByRole("textbox", { name: /select status/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
