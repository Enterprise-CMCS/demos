import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ReferencesHeader } from "./ReferencesHeader";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("ReferencesHeader", () => {
  it("renders the References Dashboard title", () => {
    render(
      <MemoryRouter>
        <ReferencesHeader />
      </MemoryRouter>
    );
    expect(screen.getByText("References")).toBeInTheDocument();
    expect(screen.getByLabelText("Book")).toBeInTheDocument();
  });

  it("renders the Close References button", () => {
    render(
      <MemoryRouter>
        <ReferencesHeader />
      </MemoryRouter>
    );
    expect(screen.getByTestId("close-references")).toBeInTheDocument();
  });

  it("navigates back when Close References is clicked", () => {
    render(
      <MemoryRouter>
        <ReferencesHeader />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByTestId("close-references"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
