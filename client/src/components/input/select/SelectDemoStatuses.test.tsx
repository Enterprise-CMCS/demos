// client/src/components/select/SelectDemoStatuses.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectDemoStatuses } from "./SelectDemoStatuses";

describe("<SelectDemoStatuses />", () => {
  it("filters and selects a status, calling onStatusChange with the name", async () => {
    const onStatusChange = vi.fn();
    render(
      <SelectDemoStatuses
        onStatusChange={onStatusChange}
        isRequired={false}
        isDisabled={false}
      />
    );

    // Focus and type to match "Under Review"
    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "revi");

    // It should show only "Under Review"
    expect(screen.getByText("Under Review")).toBeInTheDocument();
    expect(screen.queryByText("On-hold")).toBeNull();
    expect(screen.queryByText("Approved")).toBeNull();

    // Click "Under Review"
    await userEvent.click(screen.getByText("Under Review"));

    // Callback should be called once with "Under Review"
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith("Under Review");
  });

  it("shows 'No matches found' when nothing matches", async () => {
    render(<SelectDemoStatuses onStatusChange={() => {}} />);

    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "xyz");

    expect(screen.getByText("No matches found")).toBeInTheDocument();
  });

  it("applies required and disabled attributes to the input", () => {
    render(
      <SelectDemoStatuses
        onStatusChange={() => {}}
        isRequired={true}
        isDisabled={true}
      />
    );

    const input = screen.getByRole("textbox", { name: /select status/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
