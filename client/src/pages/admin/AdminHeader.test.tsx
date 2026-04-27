import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";

describe("AdminHeader", () => {
  it("renders the Admin Dashboard title", () => {
    render(<MemoryRouter><AdminHeader /></MemoryRouter>);
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("renders the Close Admin button", () => {
    render(<MemoryRouter><AdminHeader /></MemoryRouter>);
    expect(screen.getByTestId("close-admin")).toBeInTheDocument();
  });
});
