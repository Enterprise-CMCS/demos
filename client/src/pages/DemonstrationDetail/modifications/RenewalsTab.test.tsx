import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RenewalsTab } from "./RenewalsTab";
import { ModificationTabs } from "./ModificationTabs";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";

const showCreateRenewalDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateRenewalDialog,
  }),
}));

vi.mock("./ModificationTabs", () => ({
  ModificationTabs: vi.fn(() => <div data-testid="modification-tabs">Modification Tabs</div>),
}));

const mockRenewals = [
  {
    id: "renewal-1",
    name: "Renewal 1",
    description: "Description",
    status: "Pre-Submission",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    effectiveDate: new Date("2024-02-01T00:00:00Z"),
    signatureLevel: "OCD",
    documents: [],
  },
] as DemonstrationDetailModification[];

describe("RenewalsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRenewalsTab = (
    renewals: DemonstrationDetailModification[] = [],
    canCreateModifications = true,
    currentUser = cmsMockUser
  ) => {
    return render(
      <TestProvider currentUser={currentUser}>
        <RenewalsTab
          demonstrationId="mock-demonstration-id"
          medicaidId="mock-medicaid-id"
          renewals={renewals}
          selectedRenewalId="mock-renewal-id"
          canCreateModifications={canCreateModifications}
        />
      </TestProvider>
    );
  };

  it("shows empty state message when there are no renewals", async () => {
    renderRenewalsTab();

    expect(screen.getByText("No renewals have been added yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Renewals/i })).not.toBeInTheDocument();
    expect(ModificationTabs).not.toHaveBeenCalled();
  });

  it("shows centered create renewal button when there are no renewals", async () => {
    renderRenewalsTab();

    const createButton = screen.getByRole("button", { name: /create renewal/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("Create Renewal");
  });

  it("opens Add New Renewal modal from the empty state", async () => {
    renderRenewalsTab();

    const createButton = screen.getByRole("button", { name: /create renewal/i });
    await fireEvent.click(createButton);

    expect(showCreateRenewalDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Renewal modal from the empty state when creation is disabled", async () => {
    renderRenewalsTab([], false);

    const createButton = screen.getByRole("button", { name: /create renewal/i });
    expect(createButton).toBeDisabled();
    await fireEvent.click(createButton);

    expect(showCreateRenewalDialog).not.toHaveBeenCalled();
  });

  it("shows renewals tab title when renewals exist", async () => {
    renderRenewalsTab(mockRenewals);

    expect(screen.getByRole("heading", { name: /Renewals/i })).toBeInTheDocument();
  });

  it("shows add renewal button when renewals exist", async () => {
    renderRenewalsTab(mockRenewals);

    const addButton = screen.getByRole("button", { name: /add-new-renewal/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Renewal");
  });

  it("opens Add New Renewal modal from the header button", async () => {
    renderRenewalsTab(mockRenewals);

    const addButton = screen.getByRole("button", { name: /add-new-renewal/i });
    await fireEvent.click(addButton);

    expect(showCreateRenewalDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Renewal modal from the header button when creation is disabled", async () => {
    renderRenewalsTab(mockRenewals, false);

    const addButton = screen.getByRole("button", { name: /add-new-renewal/i });
    expect(addButton).toBeDisabled();
    await fireEvent.click(addButton);

    expect(showCreateRenewalDialog).not.toHaveBeenCalled();
  });

  it("passes the selected renewal to ModificationTabs when renewals exist", async () => {
    renderRenewalsTab(mockRenewals);

    expect(ModificationTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "renewal-1",
            medicaidId: "mock-medicaid-id",
            modificationType: "renewal",
          }),
        ],
        selectedItemId: "mock-renewal-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-tabs")).toBeInTheDocument();
  });

  describe("Readonly User Behavior", () => {
    it("does not render the create renewal button for readonly users", () => {
      renderRenewalsTab([], true, readonlyMockUser);
      expect(screen.queryByRole("button", { name: /create renewal/i })).not.toBeInTheDocument();
    });

    it("does not render the add renewal button for readonly users", () => {
      renderRenewalsTab(mockRenewals, true, readonlyMockUser);
      expect(screen.queryByRole("button", { name: /add-new-renewal/i })).not.toBeInTheDocument();
    });
  });
});
