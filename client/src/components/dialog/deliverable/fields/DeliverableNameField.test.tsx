import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DELIVERABLE_NAME_FIELD_ID, DeliverableNameField } from "./DeliverableNameField";

describe("DeliverableNameField", () => {
  const setup = (value = "", onChange = vi.fn()) => {
    render(<DeliverableNameField value={value} onChange={onChange} />);
    return { onChange };
  };

  it("renders the label", () => {
    setup();

    expect(screen.getByLabelText(/Deliverable Name/i)).toBeInTheDocument();
  });

  it("renders the required indicator", () => {
    setup();

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders the current value", () => {
    setup("My Deliverable");

    expect(screen.getByTestId(DELIVERABLE_NAME_FIELD_ID)).toHaveValue("My Deliverable");
  });

  it("calls onChange when the user types", async () => {
    const user = userEvent.setup();
    const { onChange } = setup();

    await user.type(screen.getByTestId(DELIVERABLE_NAME_FIELD_ID), "New Name");

    expect(onChange).toHaveBeenCalled();
  });

  it("is disabled when isDisabled is true", () => {
    render(<DeliverableNameField value="" onChange={vi.fn()} isDisabled />);

    expect(screen.getByTestId(DELIVERABLE_NAME_FIELD_ID)).toBeDisabled();
  });
});
