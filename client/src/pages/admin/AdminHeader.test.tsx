import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminHeader } from "./AdminHeader";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminHeader", () => {
  it("renders the Admin Dashboard title", () => {
    render(<MemoryRouter><AdminHeader /></MemoryRouter>);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
  });

  it("renders the Close Admin button", () => {
    render(<MemoryRouter><AdminHeader /></MemoryRouter>);
    expect(screen.getByTestId("close-admin")).toBeInTheDocument();
  });

  it("navigates back when Close Admin is clicked", () => {
    render(<MemoryRouter><AdminHeader /></MemoryRouter>);
    fireEvent.click(screen.getByTestId("close-admin"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
