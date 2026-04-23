import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ADMIN_LINK_NAME, QuickLinks } from "./QuickLinks";

describe("QuickLinks", () => {
  it("renders all quick links", () => {
    render(
      <MemoryRouter>
        <QuickLinks />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });

  it("underlines Admin link when on /admin route", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <QuickLinks />
      </MemoryRouter>
    );
    const adminLink = screen.getByTestId(ADMIN_LINK_NAME);
    expect(adminLink.className).toContain("border-b-2");
  });

  it("does not underline Admin link when not on /admin route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <QuickLinks />
      </MemoryRouter>
    );
    const adminLink = screen.getByTestId(ADMIN_LINK_NAME);
    expect(adminLink.className).not.toContain("border-b-2");
  });
});
