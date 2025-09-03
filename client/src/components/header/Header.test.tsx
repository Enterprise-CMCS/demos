import React from "react";

import { UserProvider } from "components/user/UserContext";
import { userMocks } from "mock-data/userMocks";
import { vi } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen } from "@testing-library/react";

import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { Header } from "./Header";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <MockedProvider mocks={userMocks} addTypename={false}>
      <UserProvider>{ui}</UserProvider>
    </MockedProvider>
  );
}

vi.mock("react-oidc-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: true,
    user: { id_token: "fake-token" },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    removeUser: vi.fn(),
  }),
}));

describe("Header", () => {
  it("renders the logo", () => {
    renderWithProviders(<Header />);
    expect(screen.getByAltText("Logo")).toBeInTheDocument();
  });

  it("renders all quick links", () => {
    renderWithProviders(<QuickLinks />);
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });

  it("renders the Create New button", async () => {
    renderWithProviders(<DefaultHeaderLower />);
    expect(await screen.findByTestId("create-new")).toBeInTheDocument(); // ← await
  });

  it("toggles menu under Profile Block (Top right corner)", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = await screen.findByText("John Doe");

    fireEvent.click(profileName);
    // NOW an anchor with text "Sign Out"
    const signOutLink = await screen.findByRole("link", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.click(profileName);
    expect(screen.queryByRole("link", { name: /Sign Out/i })).not.toBeInTheDocument();
  });

  it("toggles menu under Profile Block", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = await screen.findByText("John Doe");

    fireEvent.click(profileName);
    const signOutLink = await screen.findByRole("link", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.click(profileName);
    expect(screen.queryByRole("link", { name: /Sign Out/i })).not.toBeInTheDocument();
  });
});
