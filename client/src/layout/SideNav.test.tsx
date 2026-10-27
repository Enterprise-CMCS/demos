import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SideNav } from "./SideNav";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";
import type { CurrentUser } from "components/user/UserContext";

const oactUser: CurrentUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-oact-user" },
};

const renderSideNav = (currentUser?: CurrentUser) => {
  return render(
    <TestProvider currentUser={currentUser}>
      <SideNav />
    </TestProvider>
  );
};

describe("SideNav", () => {
  it("renders all nav links", () => {
    renderSideNav();
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
    expect(screen.getByText("Deliverables")).toBeInTheDocument();
  });

  it("hides the Deliverables link for demos-oact-user", () => {
    renderSideNav(oactUser);
    expect(screen.getByText("Demonstrations")).toBeInTheDocument();
    expect(screen.queryByText("Deliverables")).not.toBeInTheDocument();
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
