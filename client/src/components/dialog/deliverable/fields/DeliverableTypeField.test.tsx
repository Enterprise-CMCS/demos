import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DeliverableTypeField } from "./DeliverableTypeField";

describe("DeliverableTypeField", () => {
  const setup = (value = "", onSelect = vi.fn()) => {
    render(<DeliverableTypeField value={value} onSelect={onSelect} />);
    return { onSelect };
  };

  it("renders the label", () => {
    setup();

    expect(screen.getByLabelText(/Deliverable Type/i)).toBeInTheDocument();
  });

  it("renders the required indicator", () => {
    setup();

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows all deliverable type options when opened", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId("select-deliverable-type"));

    expect(screen.getByText("Annual Budget Neutrality Report")).toBeInTheDocument();
    expect(screen.getByText("Transition Plan")).toBeInTheDocument();
  });

  it("calls onSelect when an option is chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();

    await user.click(screen.getByTestId("select-deliverable-type"));
    await user.click(screen.getByText("Monitoring Report"));

    expect(onSelect).toHaveBeenCalledWith("Monitoring Report");
  });

  it("is disabled when isDisabled is true", () => {
    render(<DeliverableTypeField value="" onSelect={vi.fn()} isDisabled />);

    expect(screen.getByTestId("select-deliverable-type")).toBeDisabled();
  });
});
