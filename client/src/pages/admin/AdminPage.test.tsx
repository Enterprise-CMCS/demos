import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  it("renders the Admin card title", () => {
    render(<AdminPage />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders User Management tab", () => {
    render(<AdminPage />);
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("renders Type/Tag Management tab", () => {
    render(<AdminPage />);
    expect(screen.getByText("Type/Tag Management")).toBeInTheDocument();
  });

  it("shows User Management content by default", () => {
    render(<AdminPage />);
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });
});
