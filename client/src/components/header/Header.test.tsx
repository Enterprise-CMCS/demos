import React from "react";
import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DialogProvider } from "components/dialog/DialogContext";
import { TestProvider } from "test-utils/TestProvider";
import { Route, Routes } from "react-router-dom";
import { Header } from "./Header";
import { PROFILE_BUTTON_TEST_ID, ProfileBlock, SIGNOUT_LINK_TEST_ID } from "./ProfileBlock";
import { QUICK_LINKS_TEST_ID } from "./QuickLinks";

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <TestProvider>
      <DialogProvider>{ui}</DialogProvider>
    </TestProvider>
  );
}

vi.mock("pages/deliverables/DeliverableDetailHeader", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("pages/deliverables/DeliverableDetailHeader")>();
  return {
    ...actual,
    DeliverableDetailHeader: ({ deliverableId }: { deliverableId: string }) => (
      <div data-testid="deliverable-detail-header">{deliverableId}</div>
    ),
  };
});

describe("Header", () => {
  it("renders the logo", async () => {
    renderWithProviders(<Header />);
    await waitFor(() => expect(screen.getByTestId("demos-logo")).toBeInTheDocument());
  });

  it("renders the QuickLinks", async () => {
    renderWithProviders(<Header />);
    expect(await screen.findByTestId(QUICK_LINKS_TEST_ID)).toBeInTheDocument();
  });

  it("opens and closes the ProfileBlock menu when toggled by clicking the name", async () => {
    renderWithProviders(<ProfileBlock />);
    const profileButton = screen.getByTestId(PROFILE_BUTTON_TEST_ID);

    fireEvent.click(profileButton);
    const signOutLink = await screen.findByTestId(SIGNOUT_LINK_TEST_ID);
    expect(signOutLink).toBeVisible();

    fireEvent.click(profileButton);
    expect(screen.queryByTestId(SIGNOUT_LINK_TEST_ID)).not.toBeInTheDocument();
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

    const profileButton = screen.getByTestId(PROFILE_BUTTON_TEST_ID);

    fireEvent.click(profileButton);
    const signOutLink = await screen.findByTestId(SIGNOUT_LINK_TEST_ID);
    expect(signOutLink).toBeVisible();

    fireEvent.mouseDown(screen.getByTestId("outside-area"));

    expect(screen.queryByTestId(SIGNOUT_LINK_TEST_ID)).not.toBeInTheDocument();
  });
});
