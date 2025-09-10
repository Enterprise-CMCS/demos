// client/src/components/select/SelectDemoStatuses.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SelectDemoStatuses } from "./SelectDemoStatuses";
import { MockedProvider } from "@apollo/client/testing";
import { DEMONSTRATION_STATUS_OPTIONS_QUERY } from "queries/demonstrationQueries";

const mocks = [
  {
    request: { query: DEMONSTRATION_STATUS_OPTIONS_QUERY },
    result: {
      data: {
        demonstrationStatuses: [
          { id: "1", name: "On Hold" },
          { id: "2", name: "Pending" },
          { id: "3", name: "Approved" },
        ],
      },
    },
  },
];

describe("<SelectDemoStatuses />", () => {
  it("filters and selects a status, calling onStatusChange with the name", async () => {
    const onStatusChange = vi.fn();
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SelectDemoStatuses
          onStatusChange={onStatusChange}
          isRequired={false}
          isDisabled={false}
        />
      </MockedProvider>
    );

    // Focus and type "pe" to match "Pending"
    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "pe");

    // It should show only "Pending"
    expect(await screen.findByText("Pending")).toBeInTheDocument();
    expect(screen.queryByText("On Hold")).toBeNull();
    expect(screen.queryByText("Approved")).toBeNull();

    // Click "Pending"
    await userEvent.click(screen.getByText("Pending"));

    // Callback should be called once with "Pending"
    expect(onStatusChange).toHaveBeenCalledTimes(1);
    expect(onStatusChange).toHaveBeenCalledWith("Pending");
  });

  it("shows 'No matches found' when nothing matches", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SelectDemoStatuses onStatusChange={() => {}} />
      </MockedProvider>
    );

    const input = screen.getByRole("textbox", { name: /select status/i });
    await userEvent.click(input);
    await userEvent.type(input, "xyz");

    expect(await screen.findByText("No matches found")).toBeInTheDocument();
  });

  it("applies required and disabled attributes to the input", () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SelectDemoStatuses
          onStatusChange={() => {}}
          isRequired={true}
          isDisabled={true}
        />
      </MockedProvider>
    );

    const input = screen.getByRole("textbox", { name: /select status/i });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
