import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import SideNav from "./SideNav";

describe("SideNav", () => {
  it("renders all nav links", () => {
    render(<SideNav collapsed={false} setCollapsed={() => { }} />, { wrapper: MemoryRouter });
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("toggles collapse when menu button is clicked", () => {
    const mockSetCollapsed = vi.fn();
    render(<SideNav collapsed={false} setCollapsed={mockSetCollapsed} />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByLabelText(/Collapse Menu/i));
    expect(mockSetCollapsed).toHaveBeenCalledWith(true);
  });

  it("shows only icons when collapsed", () => {
    render(<SideNav collapsed={true} setCollapsed={() => { }} />, { wrapper: MemoryRouter });
    expect(screen.queryByText("Demonstrations")).not.toBeInTheDocument();
  });
});
