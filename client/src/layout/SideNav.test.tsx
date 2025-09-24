import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { SideNav } from "./SideNav";

const renderSideNav = () => {
  return render(<SideNav />, { wrapper: MemoryRouter });
};

describe("SideNav", () => {
  it("renders all nav links", () => {
    renderSideNav();
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
  });

  it("toggles collapse when menu button is clicked", () => {
    renderSideNav();
    fireEvent.click(screen.getByLabelText(/Collapse Menu/i));
  });

  it("shows only icons when collapsed", () => {
    renderSideNav();
    fireEvent.click(screen.getByTestId("collapse-sidenav"));
    expect(screen.queryByText("Demonstrations")).not.toBeInTheDocument();
  });

  it("shows text labels when expanded after being collapsed", () => {
    renderSideNav();

    fireEvent.click(screen.getByTestId("collapse-sidenav"));
    expect(screen.queryByText("Demonstrations")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("expand-sidenav"));
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
  });
});
