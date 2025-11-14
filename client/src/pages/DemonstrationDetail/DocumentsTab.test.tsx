import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentsTab } from "./DocumentsTab";

// Mock the DocumentTable component
vi.mock("components/table/tables/DocumentTable", () => ({
  DocumentTable: vi.fn(),
}));

// Mock the dialog context
const showUploadDocumentDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showUploadDocumentDialog,
  }),
}));

// Import mocked components to use in assertions
import { DocumentTable } from "components/table/tables/DocumentTable";

describe("DemonstrationTab - Documents Tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<DocumentsTab demonstrationId={"test-demonstration-id"} />);
  });

  it("shows documents title", async () => {
    expect(screen.getByRole("heading", { name: /Documents/i })).toBeInTheDocument();
  });

  it("shows Add Document button in documents tab", async () => {
    const addDocumentButton = screen.getByRole("button", { name: /add-new-document/i });
    expect(addDocumentButton).toBeInTheDocument();
    expect(addDocumentButton).toHaveTextContent("Add Document");
  });

  it("opens upload document dialog when add document is clicked", async () => {
    const addDocumentButton = screen.getByRole("button", { name: /add-new-document/i });
    fireEvent.click(addDocumentButton);

    expect(showUploadDocumentDialog).toHaveBeenCalledWith("test-demonstration-id");
  });

  it("passes correct props to DocumentTable", async () => {
    expect(DocumentTable).toHaveBeenCalledWith(
      {
        applicationId: "test-demonstration-id",
      },
      undefined
    );
  });
});
