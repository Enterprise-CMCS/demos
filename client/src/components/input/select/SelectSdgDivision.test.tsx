import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectSdgDivision } from "./SelectSdgDivision";
import { SDG_DIVISIONS } from "demos-server-constants";
import { getSelectOptionLabels, selectOption } from "test-utils/select";

const onSelect = vi.fn();

describe("SelectSdgDivision", () => {
  it("renders division options with proper labels", async () => {
    const user = userEvent.setup();
    render(<SelectSdgDivision onSelect={onSelect} />);
    const optionLabels = await getSelectOptionLabels(user, screen.getByLabelText("SDG Division"));
    expect(optionLabels).toEqual(["Select SDG Division", ...SDG_DIVISIONS]);
  });

  it("calls onSelect when an option is selected", async () => {
    const user = userEvent.setup();
    render(<SelectSdgDivision onSelect={onSelect} />);
    const select = screen.getByLabelText("SDG Division");
    await selectOption(user, select, SDG_DIVISIONS[0]);
    expect(select).toHaveTextContent(SDG_DIVISIONS[0]);
    expect(onSelect).toHaveBeenCalledWith(SDG_DIVISIONS[0]);
  });
});
