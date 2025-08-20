// src/components/header/Header.test.tsx
import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { userMocks } from "mock-data/userMocks";

import { Avatar } from "./Avatar";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { Header } from "./Header";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";

// Use the correct UserProvider import for your project
import { UserProvider } from "components/user/UserContext";

// Mock react-oidc-context so useAuth works without wiring AuthProvider
vi.mock("react-oidc-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: true,
    user: { id_token: "fake-token", cognitoSubject: "fake-cognito-subject" },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    removeUser: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <MockedProvider mocks={userMocks} addTypename={false}>
      <UserProvider>{ui}</UserProvider>
    </MockedProvider>
  );
}

describe("Header", () => {
  it("renders the logo", () => {
    render(<Header />);
    expect(screen.getByAltText("Logo")).toBeInTheDocument();
  });

  it("renders all quick links", () => {
    render(<QuickLinks />);
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });

  it("renders the profile block with the current user's name", async () => {
    renderWithProviders(<ProfileBlock />);
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("renders the Create New button", async () => {
    renderWithProviders(<DefaultHeaderLower />);
    expect(await screen.findByRole("button", { name: /Create New/i })).toBeInTheDocument();
  });

  it("toggles menu under Profile Block", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = await screen.findByText("John Doe");

    // open
    fireEvent.click(profileName);
    const logoutButton = await screen.findByText("Logout");
    expect(logoutButton).toBeVisible();

    // close
    fireEvent.click(profileName);
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("toggles menu under Profile Block", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = await screen.findByText("John Doe");

    fireEvent.click(profileName);
    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeVisible();

    fireEvent.click(profileName);
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
