import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExtensionsTab } from "./ExtensionsTab";
import { ModificationTabs } from "./ModificationTabs";

const showCreateExtensionDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateExtensionDialog,
  }),
}));

vi.mock("./ModificationTabs", () => ({
  ModificationTabs: vi.fn(() => <div data-testid="modification-tabs">Modification Tabs</div>),
}));

describe("ExtensionsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderExtensionsTab = () => {
    return render(
      <ExtensionsTab
        demonstrationId="mock-demonstration-id"
        medicaidId="mock-medicaid-id"
        extensions={[]}
        selectedExtensionId="mock-extension-id"
      />
    );
  };

  it("shows extensions tab title", async () => {
    renderExtensionsTab();

    expect(screen.getByRole("heading", { name: /Extensions/i })).toBeInTheDocument();
  });

  it("shows add extension button", async () => {
    renderExtensionsTab();

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add Extension");
  });

  it("opens Add New Extension modal", async () => {
    renderExtensionsTab();

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    await fireEvent.click(addButton);

    expect(showCreateExtensionDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });

  it("passes the selected extension to ModificationTabs", async () => {
    renderExtensionsTab();

    expect(ModificationTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
        selectedItemId: "mock-extension-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-tabs")).toBeInTheDocument();
  });
});
