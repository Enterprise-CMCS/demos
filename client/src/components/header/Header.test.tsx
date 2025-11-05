import React from "react";
import { vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UserProvider } from "components/user/UserContext";
import { userMocks } from "mock-data/userMocks";
import { TestProvider } from "test-utils/TestProvider";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { Header } from "./Header";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <TestProvider mocks={userMocks} addTypename={false}>
      <UserProvider>{ui}</UserProvider>
    </TestProvider>
  );
}

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({}),
}));

vi.mock("react-oidc-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id_token: "fake" },
    signinRedirect: vi.fn(),
    signoutRedirect: vi.fn(),
    removeUser: vi.fn(),
    revokeTokens: vi.fn(),
    activeNavigator: undefined,
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
    expect(await screen.findByTestId("create-new")).toBeInTheDocument();
  });

  it("opens and closes the ProfileBlock menu when toggled by clicking the name", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = await screen.findByText("Mock User");

    fireEvent.click(profileName);
    const signOutLink = await screen.findByRole("button", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.click(profileName);
    expect(screen.queryByRole("button", { name: /Sign Out/i })).not.toBeInTheDocument();
  });

  it("closes the ProfileBlock menu when clicking outside", async () => {
    renderWithProviders(
      <>
        <ProfileBlock />
        <div data-testid="outside-area">Outside Area</div>
      </>
    );

    const profileName = await screen.findByText("Mock User");

    fireEvent.click(profileName);
    const signOutLink = await screen.findByRole("button", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.mouseDown(screen.getByTestId("outside-area"));

    expect(screen.queryByRole("button", { name: /Sign Out/i })).not.toBeInTheDocument();
  });
});
