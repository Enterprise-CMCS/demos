import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ADMIN_LINK_NAME, QuickLinks } from "./QuickLinks";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser, MockUser } from "mock-data/userMocks";
import { MemoryRouterProps } from "react-router-dom";

const adminUser: MockUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-admin" },
};

const nonAdminUser: MockUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-cms-user" },
};

const setup = (
  currentUser = adminUser,
  routerEntries: MemoryRouterProps["initialEntries"] = ["/"]
) => {
  render(
    <TestProvider currentUser={currentUser} routerEntries={routerEntries}>
      <QuickLinks />
    </TestProvider>
  );
};

describe("QuickLinks", () => {
  it("renders all quick links for an admin user", () => {
    setup();
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });

  it("does not render the Admin link for a non-admin user", () => {
    setup(nonAdminUser);
    expect(screen.queryByTestId(ADMIN_LINK_NAME)).not.toBeInTheDocument();
  });

  it("underlines Admin link when on /admin route", () => {
    setup(adminUser, ["/admin"]);
    const adminLink = screen.getByTestId(ADMIN_LINK_NAME);
    expect(adminLink.className).toContain("border-b");
  });

  it("does not underline Admin link when not on /admin route", () => {
    setup(adminUser, ["/"]);
    const adminLink = screen.getByTestId(ADMIN_LINK_NAME);
    expect(adminLink.className).not.toContain("border-b");
  });
});
