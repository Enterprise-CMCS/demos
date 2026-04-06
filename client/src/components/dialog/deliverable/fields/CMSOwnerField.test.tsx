import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MockedProvider } from "@apollo/client/testing";

import { personMocks } from "mock-data/personMocks";
import { CMSOwnerField } from "./CMSOwnerField";

describe("CMSOwnerField", () => {
  const setup = (value = "", onSelect = vi.fn()) => {
    render(
      <MockedProvider mocks={personMocks}>
        <CMSOwnerField value={value} onSelect={onSelect} />
      </MockedProvider>
    );
    return { onSelect };
  };

  it("renders the label", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/CMS Owner/i)).toBeInTheDocument();
    });
  });

  it("renders the required indicator", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  it("shows users after data loads", async () => {
    const user = userEvent.setup();
    setup();

    const input = await screen.findByTestId("select-users");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("calls onSelect when a user is chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();

    const input = await screen.findByTestId("select-users");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("John Doe"));

    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("is disabled when isDisabled is true", async () => {
    render(
      <MockedProvider mocks={personMocks}>
        <CMSOwnerField value="" onSelect={vi.fn()} isDisabled />
      </MockedProvider>
    );

    const input = await screen.findByTestId("select-users");
    expect(input).toBeDisabled();
  });
});
