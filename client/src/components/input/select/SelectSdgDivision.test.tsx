import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectSdgDivision } from "./SelectSdgDivision";
import { SDG_DIVISIONS } from "demos-server-constants";

const onSelect = vi.fn();

describe("SelectSdgDivision", () => {
  it("renders division options with proper labels", () => {
    render(<SelectSdgDivision onSelect={onSelect} />);
    const select = screen.getByLabelText("SDG Division");
    fireEvent.mouseDown(select);
    SDG_DIVISIONS.forEach((division) => {
      expect(screen.getByText(division)).toBeInTheDocument();
    });
  });

  it("calls onSelect when an option is selected", () => {
    render(<SelectSdgDivision onSelect={onSelect} />);
    const select = screen.getByLabelText("SDG Division");
    fireEvent.mouseDown(select);
    fireEvent.change(select, { target: { value: SDG_DIVISIONS[0] } });
    expect(select).toHaveValue(SDG_DIVISIONS[0]);
    expect(onSelect).toHaveBeenCalledWith(SDG_DIVISIONS[0]);
  });
});
