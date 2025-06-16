import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";
import { ProfileBlock } from "./ProfileBlock";
import { QuickLinks } from "./QuickLinks";
import { HeaderLower } from "./HeaderLower";
import { Avatar } from "./Avatar";
import { MockedProvider } from "@apollo/client/testing";
import { userMocks } from "mock-data/userMocks";

describe("Header", async () => {
  it("renders the logo", () => {
    render(<Header />);
    expect(screen.getByAltText("Logo")).toBeInTheDocument();
  });

  it("renders all quick links", () => {
    render(<QuickLinks />);
    expect(screen.getByRole("link", { name: /Admin/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Notifications/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Help/i })).toBeInTheDocument();
  });

  it("renders the profile block", async () => {
    render(
      <MockedProvider mocks={userMocks} addTypename={false}>
        <ProfileBlock userId={2} />
      </MockedProvider>
    );
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
  });

  it("renders the avatar", () => {
    render(<Avatar character={"J"} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders the greeting", async () => {
    render(
      <MockedProvider mocks={userMocks} addTypename={false}>
        <HeaderLower userId={2} />
      </MockedProvider>
    );
    expect(await screen.findByText("Hello John Doe")).toBeInTheDocument();
    expect(await screen.findByText("Welcome to DEMOS!")).toBeInTheDocument();
  });

  it("renders the Create New button", async () => {
    render(
      <MockedProvider mocks={userMocks} addTypename={false}>
        <HeaderLower userId={2} />
      </MockedProvider>
    );
    expect(
      await screen.findByRole("button", { name: /Create New/i })
    ).toBeInTheDocument();
  });

  it("toggles menu under Profile Block", async () => {
    render(
      <MockedProvider mocks={userMocks} addTypename={false}>
        <ProfileBlock userId={2} />
      </MockedProvider>
    );

    const profileContainer = await screen.findByText("John Doe");
    fireEvent.click(profileContainer);

    const logoutButton = screen.getByText("Logout");
    expect(logoutButton).toBeVisible();

    fireEvent.click(profileContainer);
    expect(logoutButton).not.toBeVisible();
  });
});
