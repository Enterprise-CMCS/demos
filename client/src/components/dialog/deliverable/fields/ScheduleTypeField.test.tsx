import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { SCHEDULE_TYPES, ScheduleTypeField } from "./ScheduleTypeField";

describe("ScheduleTypeField", () => {
  const setup = (value = "", onSelect = vi.fn()) => {
    render(<ScheduleTypeField value={value} onSelect={onSelect} />);
    return { onSelect };
  };

  it("renders the label", () => {
    setup();

    expect(screen.getByLabelText(/Schedule Type/i)).toBeInTheDocument();
  });

  it("renders the required indicator", () => {
    setup();

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows all schedule type options when opened", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId("select-schedule-type"));

    SCHEDULE_TYPES.forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  it("calls onSelect when an option is chosen", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();

    await user.click(screen.getByTestId("select-schedule-type"));
    await user.click(screen.getByText("Quarterly"));

    expect(onSelect).toHaveBeenCalledWith("Quarterly");
  });

  it("is disabled when isDisabled is true", () => {
    render(<ScheduleTypeField value="" onSelect={vi.fn()} isDisabled />);

    expect(screen.getByTestId("select-schedule-type")).toBeDisabled();
  });
});
