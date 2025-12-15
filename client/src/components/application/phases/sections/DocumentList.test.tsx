import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentList } from "./DocumentList";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";
import { TestProvider } from "test-utils/TestProvider";

const mockShowRemoveDocumentDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRemoveDocumentDialog: mockShowRemoveDocumentDialog,
  }),
}));

describe("DocumentList", () => {
  const mockDocuments: ApplicationWorkflowDocument[] = [
    {
      id: "doc-1",
      name: "Test Document 1",
      description: "Description 1",
      documentType: "State Application",
      createdAt: new Date("2024-01-15T10:00:00Z"), // TODO: replace with string date
      owner: {
        person: {
          fullName: "John Doe",
        },
      },
    },
    {
      id: "doc-2",
      name: "Test Document 2",
      description: "Description 2",
      documentType: "Approval Letter",
      createdAt: new Date("2024-02-20T15:30:00Z"),
      owner: {
        person: {
          fullName: "Jane Smith",
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty message when no documents", () => {
    render(
      <TestProvider>
        <DocumentList documents={[]} />
      </TestProvider>
    );

    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    const customMessage = "No files available";
    render(
      <TestProvider>
        <DocumentList documents={[]} emptyMessage={customMessage} />
      </TestProvider>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("renders list of documents", () => {
    render(
      <TestProvider>
        <DocumentList documents={mockDocuments} />
      </TestProvider>
    );

    expect(screen.getByText("Test Document 1")).toBeInTheDocument();
    expect(screen.getByText("Test Document 2")).toBeInTheDocument();
  });

  it("displays formatted creation dates", () => {
    render(
      <TestProvider>
        <DocumentList documents={mockDocuments} />
      </TestProvider>
    );

    // Dates should be formatted (adjust based on your formatDate implementation)
    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/02\/20\/2024/)).toBeInTheDocument();
  });

  it("renders delete buttons for each document", () => {
    render(
      <TestProvider>
        <DocumentList documents={mockDocuments} />
      </TestProvider>
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("calls showRemoveDocumentDialog when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TestProvider>
        <DocumentList documents={mockDocuments} />
      </TestProvider>
    );

    const deleteButton = screen.getByRole("button", { name: "Delete Test Document 1" });
    await user.click(deleteButton);

    expect(mockShowRemoveDocumentDialog).toHaveBeenCalledWith(["doc-1"]);
  });
});
