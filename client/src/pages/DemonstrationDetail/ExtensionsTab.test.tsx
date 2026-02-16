import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExtensionsTab } from "./ExtensionsTab";

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

  const renderExtensionsTab = () => {
    return render(<ExtensionsTab demonstrationId="mock-demonstration-id" />);
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
});
