import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectCMCSDivision } from "./SelectCMCSDivision";
import { CMCS_DIVISION } from "demos-server-constants";

const onSelect = vi.fn();

describe("SelectCMCSDivision", () => {
  it("renders division options with proper labels", () => {
    render(<SelectCMCSDivision onSelect={onSelect} />);
    const select = screen.getByLabelText("CMCS Division");
    fireEvent.mouseDown(select);
    CMCS_DIVISION.forEach((division) => {
      expect(screen.getByText(division)).toBeInTheDocument();
    });
  });

  it("calls onSelect when an option is selected", () => {
    render(<SelectCMCSDivision onSelect={onSelect} />);
    const select = screen.getByLabelText("CMCS Division");
    fireEvent.mouseDown(select);
    fireEvent.change(select, { target: { value: CMCS_DIVISION[0] } });
    expect(select).toHaveValue(CMCS_DIVISION[0]);
    expect(onSelect).toHaveBeenCalledWith(CMCS_DIVISION[0]);
  });
});
