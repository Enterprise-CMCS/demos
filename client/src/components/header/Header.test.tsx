import React from "react";
import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DialogProvider } from "components/dialog/DialogContext";
import { TestProvider } from "test-utils/TestProvider";
import { Route, Routes } from "react-router-dom";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { Header } from "./Header";
import { PROFILE_BLOCK_TEST_ID, ProfileBlock } from "./ProfileBlock";
import { QUICK_LINKS_TEST_ID } from "./QuickLinks";

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <TestProvider>
      <DialogProvider>{ui}</DialogProvider>
    </TestProvider>
  );
}

vi.mock(
  "pages/deliverables/DeliverableDetailHeader",
  async (importOriginal) => {
    const actual = await importOriginal<typeof import("pages/deliverables/DeliverableDetailHeader")>();
    return {
      ...actual,
      DeliverableDetailHeader: ({ deliverableId }: { deliverableId: string }) => (
        <div data-testid="deliverable-detail-header">{deliverableId}</div>
      ),
    };
  }
);

describe("Header", () => {
  it("renders the logo", async () => {
    renderWithProviders(<Header />);
    await waitFor(() => expect(screen.getByAltText("Logo")).toBeInTheDocument());
  });

  it("renders the QuickLinks", async () => {
    renderWithProviders(<Header />);
    expect(await screen.findByTestId(QUICK_LINKS_TEST_ID)).toBeInTheDocument();
  });

  it("renders the Create New button", async () => {
    renderWithProviders(<DefaultHeaderLower />);
    expect(await screen.findByTestId("create-new")).toBeInTheDocument();
  });

  it("opens and closes the ProfileBlock menu when toggled by clicking the name", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileName = screen.getByTestId(PROFILE_BLOCK_TEST_ID);

    fireEvent.click(profileName);
    const signOutLink = await screen.findByRole("button", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.click(profileName);
    expect(screen.queryByRole("button", { name: /Sign Out/i })).not.toBeInTheDocument();
  });

  it("renders DeliverableDetailHeader for deliverable routes", async () => {
    render(
      <TestProvider routerEntries={["/deliverables/123"]}>
        <DialogProvider>
          <Routes>
            <Route path="/deliverables/:deliverableId" element={<Header />} />
          </Routes>
        </DialogProvider>
      </TestProvider>
    );
    expect(await screen.findByTestId("deliverable-detail-header")).toBeInTheDocument();
  });

  it("closes the ProfileBlock menu when clicking outside", async () => {
    renderWithProviders(
      <>
        <ProfileBlock />
        <div data-testid="outside-area">Outside Area</div>
      </>
    );

    const profileName = screen.getByTestId(PROFILE_BLOCK_TEST_ID);

    fireEvent.click(profileName);
    const signOutLink = await screen.findByRole("button", { name: /Sign Out/i });
    expect(signOutLink).toBeVisible();

    fireEvent.mouseDown(screen.getByTestId("outside-area"));

    expect(screen.queryByRole("button", { name: /Sign Out/i })).not.toBeInTheDocument();
  });
});
