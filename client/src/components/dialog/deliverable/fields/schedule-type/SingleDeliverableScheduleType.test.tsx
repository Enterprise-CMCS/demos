import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SingleDeliverableScheduleType } from "./SingleDeliverableScheduleType";

const DATE_IN_PAST_MESSAGE = "Date cannot be in the past";

describe("SingleDeliverableScheduleType", () => {
  it("shows the date in past message for due dates before today", () => {
    render(<SingleDeliverableScheduleType value="1900-01-01" onChange={vi.fn()} />);

    expect(screen.getByText(DATE_IN_PAST_MESSAGE)).toBeInTheDocument();
  });
});
