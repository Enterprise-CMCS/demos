import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectSignatureLevel } from "./SelectSignatureLevel";
import { SIGNATURE_LEVEL } from "demos-server-constants";

const onSelect = vi.fn();

describe("SelectSignatureLevel", () => {
  it("renders all signature level options with explicit labels", () => {
    render(<SelectSignatureLevel onSelect={onSelect} />);
    const select = screen.getByLabelText("Signature Level");
    fireEvent.mouseDown(select);
    expect(screen.getByText("OA - Office of the Administrator")).toBeInTheDocument();
    expect(screen.getByText("OCD - Office of the Center Director")).toBeInTheDocument();
    expect(screen.getByText("OGD - Office of the Group Director")).toBeInTheDocument();
  });

  it("calls onSelect when an option is selected", () => {
    render(<SelectSignatureLevel onSelect={onSelect} />);
    const select = screen.getByLabelText("Signature Level");
    fireEvent.change(select, { target: { value: SIGNATURE_LEVEL[0] } });
    expect(onSelect).toHaveBeenCalledWith(SIGNATURE_LEVEL[0]);
  });
});
