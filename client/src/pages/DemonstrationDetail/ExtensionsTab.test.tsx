import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExtensionsTab } from "./ExtensionsTab";
import { ExtensionTable } from "components/table/tables/ExtensionTable";

vi.mock("components/table/tables/ExtensionTable", () => ({
  ExtensionTable: vi.fn(() => <div data-testid="extension-table">ExtensionTable</div>),
}));

const showCreateExtensionDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateExtensionDialog,
  }),
}));

describe("ExtensionsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderExtensionsTab = (initiallyExpandedId?: string) => {
    return render(
      <ExtensionsTab
        demonstrationId="mock-demonstration-id"
        initiallyExpandedId={initiallyExpandedId}
      />
    );
  };

  it("shows extensions tab title", async () => {
    renderExtensionsTab();

    expect(screen.getByRole("heading", { name: /Extensions/i })).toBeInTheDocument();
  });

  it("shows extensions table", async () => {
    renderExtensionsTab();

    expect(ExtensionTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: undefined,
      }),
      undefined
    );
    expect(screen.getByTestId("extension-table")).toBeInTheDocument();
  });

  it("passes initiallyExpandedId to ExtensionTable", async () => {
    renderExtensionsTab("extension-123");

    expect(ExtensionTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: "extension-123",
      }),
      undefined
    );
  });

  it("does not pass initiallyExpandedId when undefined", async () => {
    renderExtensionsTab();

    expect(ExtensionTable).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "mock-demonstration-id",
        initiallyExpandedId: undefined,
      }),
      undefined
    );
  });

  it("shows add extension button", async () => {
    renderExtensionsTab();

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent("Add New");
  });

  it("opens Add New Extension modal", async () => {
    renderExtensionsTab();

    const addButton = screen.getByRole("button", { name: /add-new-extension/i });
    await fireEvent.click(addButton);

    expect(showCreateExtensionDialog).toHaveBeenCalledWith("mock-demonstration-id");
  });
});
