// src/pages/LandingPage.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const mod = await vi.importActual<any>("react-router-dom");
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  // I was getting an error on useNavigate, had to add memoryRouter.
  it("renders a Login button", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Only check for the button now—no table
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("navigates to /login when Login button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /login/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("does not render a DemonstrationTable", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Confirm there's no “Number” header or any table text
    expect(screen.queryByText(/Number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demonstrations/i)).not.toBeInTheDocument();
  });
});
