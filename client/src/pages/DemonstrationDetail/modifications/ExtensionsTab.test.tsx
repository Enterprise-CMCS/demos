import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExtensionsTab } from "./ExtensionsTab";
import { ModificationTabs } from "./ModificationTabs";
import { DemonstrationDetailModification } from "pages/DemonstrationDetail/DemonstrationDetail";

const showCreateExtensionDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateExtensionDialog,
  }),
}));

vi.mock("./ModificationTabs", () => ({
  ModificationTabs: vi.fn(() => <div data-testid="modification-tabs">Modification Tabs</div>),
}));

const mockExtensions = [
  {
    id: "extension-1",
    name: "Extension 1",
    description: "Description",
    status: "Pre-Submission",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    effectiveDate: new Date("2024-02-01T00:00:00Z"),
    signatureLevel: "OCD",
    documents: [],
  },
] as DemonstrationDetailModification[];

describe("ExtensionsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderExtensionsTab = (
    extensions: DemonstrationDetailModification[] = [],
    canCreateModifications = true
  ) => {
    return render(
      <ExtensionsTab
        demonstrationId="mock-demonstration-id"
        medicaidId="mock-medicaid-id"
        extensions={extensions}
        selectedExtensionId="mock-extension-id"
        canCreateModifications={canCreateModifications}
      />
    );
  };

  it("shows empty state message when there are no extensions", async () => {
    renderExtensionsTab();

    expect(screen.getByText("No extensions have been added yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Extensions/i })).not.toBeInTheDocument();
    expect(ModificationTabs).not.toHaveBeenCalled();
  });

  it("shows centered create extension button when there are no extensions", async () => {
    renderExtensionsTab();

    const createButton = screen.getByRole("button", { name: /create extension/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent("Create Extension");
  });

  it("opens Add New Extension modal from the empty state", async () => {
    renderExtensionsTab();

    const createButton = screen.getByRole("button", { name: /create extension/i });
    await fireEvent.click(createButton);

    expect(showCreateExtensionDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Extension modal from the empty state when creation is disabled", async () => {
    renderExtensionsTab([], false);

    const createButton = screen.getByRole("button", { name: /create extension/i });
    expect(createButton).toBeDisabled();
    await fireEvent.click(createButton);

    expect(showCreateExtensionDialog).not.toHaveBeenCalled();
  });

  it("shows extensions tab title when extensions exist", async () => {
    renderExtensionsTab(mockExtensions);

    expect(screen.getByRole("heading", { name: /Extensions/i })).toBeInTheDocument();
  });

  it("shows add extension button when extensions exist", async () => {
    renderExtensionsTab(mockExtensions);

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Extension");
  });

  it("opens Add New Extension modal from the header button", async () => {
    renderExtensionsTab(mockExtensions);

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    await fireEvent.click(addButton);

    expect(showCreateExtensionDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("does not open Add New Extension modal from the header button when creation is disabled", async () => {
    renderExtensionsTab(mockExtensions, false);

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    expect(addButton).toBeDisabled();
    await fireEvent.click(addButton);

    expect(showCreateExtensionDialog).not.toHaveBeenCalled();
  });

  it("passes the selected extension to ModificationTabs when extensions exist", async () => {
    renderExtensionsTab(mockExtensions);

    expect(ModificationTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: "extension-1",
            medicaidId: "mock-medicaid-id",
            modificationType: "extension",
          }),
        ],
        selectedItemId: "mock-extension-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-tabs")).toBeInTheDocument();
  });
});
