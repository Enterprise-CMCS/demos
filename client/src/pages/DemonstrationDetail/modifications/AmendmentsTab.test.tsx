import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AmendmentsTab } from "./AmendmentsTab";
import { ModificationTabs } from "./ModificationTabs";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";

const showCreateAmendmentDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateAmendmentDialog,
  }),
}));

vi.mock("./ModificationTabs", () => ({
  ModificationTabs: vi.fn(() => <div data-testid="modification-tabs">Modification Tabs</div>),
}));

const mockAmendments = [
  {
    id: "amendment-1",
    name: "Amendment 1",
    description: "Description",
    status: "Pre-Submission",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    effectiveDate: new Date("2024-02-01T00:00:00Z"),
    signatureLevel: "OCD",
    documents: [],
  },
] as DemonstrationDetailModification[];

describe("AmendmentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAmendmentsTab = (
    amendments: DemonstrationDetailModification[] = [],
    canCreateModifications = true
  ) => {
    return render(
      <AmendmentsTab
        demonstrationId="mock-demonstration-id"
        medicaidId="mock-medicaid-id"
        amendments={amendments}
        selectedAmendmentId="mock-amendment-id"
        canCreateModifications={canCreateModifications}
      />
    );
  };

  it("shows empty state message when there are no amendments", async () => {
    renderAmendmentsTab();

    expect(screen.getByText("No amendments have been added yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Amendments/i })).not.toBeInTheDocument();
    expect(ModificationTabs).not.toHaveBeenCalled();
  });

  it("shows centered create amendment button when there are no amendments", async () => {
    renderAmendmentsTab();

    const createButton = screen.getByRole("button", { name: /create amendment/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("Create Amendment");
  });

  it("opens Add New Amendment modal from the empty state", async () => {
    renderAmendmentsTab();

    const createButton = screen.getByRole("button", { name: /create amendment/i });
    await fireEvent.click(createButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Amendment modal from the empty state when creation is disabled", async () => {
    renderAmendmentsTab([], false);

    const createButton = screen.getByRole("button", { name: /create amendment/i });
    expect(createButton).toBeDisabled();
    await fireEvent.click(createButton);

    expect(showCreateAmendmentDialog).not.toHaveBeenCalled();
  });

  it("shows amendments tab title when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    expect(screen.getByRole("heading", { name: /Amendments/i })).toBeInTheDocument();
  });

  it("shows add amendment button when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Amendment");
  });

  it("opens Add New Amendment modal from the header button", async () => {
    renderAmendmentsTab(mockAmendments);

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Amendment modal from the header button when creation is disabled", async () => {
    renderAmendmentsTab(mockAmendments, false);

    const addButton = screen.getByRole("button", { name: /add-new-amendment/i });
    expect(addButton).toBeDisabled();
    await fireEvent.click(addButton);

    expect(showCreateAmendmentDialog).not.toHaveBeenCalled();
  });

  it("passes the selected amendment to ModificationTabs when amendments exist", async () => {
    renderAmendmentsTab(mockAmendments);

    expect(ModificationTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "amendment-1",
            medicaidId: "mock-medicaid-id",
            modificationType: "amendment",
          }),
        ],
        selectedItemId: "mock-amendment-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-tabs")).toBeInTheDocument();
  });
});
