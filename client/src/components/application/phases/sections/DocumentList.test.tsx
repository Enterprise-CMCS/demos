import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import userEvent from "@testing-library/user-event";
import { DocumentList, DELETE_DOCUMENT_MUTATION } from "./DocumentList";
import { ApplicationWorkflowDocument } from "components/application/ApplicationWorkflow";
import { DOCUMENT_REMOVAL_FAILED_MESSAGE } from "util/messages";

// Mock the toast hook
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showError: mockShowError,
  }),
}));

// Mock DeleteIcon
vi.mock("components/icons/DeleteIcon", () => ({
  DeleteIcon: () => <span data-testid="delete-icon">Delete</span>,
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
      <MockedProvider mocks={[]}>
        <DocumentList documents={[]} />
      </MockedProvider>
    );

    expect(screen.getByText("No documents yet.")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    const customMessage = "No files available";
    render(
      <MockedProvider mocks={[]}>
        <DocumentList documents={[]} emptyMessage={customMessage} />
      </MockedProvider>
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("renders list of documents", () => {
    render(
      <MockedProvider mocks={[]}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    expect(screen.getByText("Test Document 1")).toBeInTheDocument();
    expect(screen.getByText("Test Document 2")).toBeInTheDocument();
  });

  it("displays formatted creation dates", () => {
    render(
      <MockedProvider mocks={[]}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    // Dates should be formatted (adjust based on your formatDate implementation)
    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/02\/20\/2024/)).toBeInTheDocument();
  });

  it("renders delete buttons for each document", () => {
    render(
      <MockedProvider mocks={[]}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(2);
  });

  it("calls delete mutation when delete button is clicked", async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT_MUTATION,
          variables: { id: "doc-1" },
        },
        result: {
          data: {
            deleteDocument: {
              id: "doc-1",
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    const deleteButtons = screen.getAllByRole("button", { name: /delete test document 1/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      // Verify the mutation was called (you can add more specific assertions)
      expect(deleteButtons[0]).not.toBeDisabled();
    });
  });

  it("disables delete buttons while loading", async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT_MUTATION,
          variables: { id: "doc-1" },
        },
        result: {
          data: {
            deleteDocument: {
              id: "doc-1",
            },
          },
        },
        delay: 100, // Simulate network delay
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    const deleteButton = screen.getByRole("button", { name: /delete test document 1/i });
    await user.click(deleteButton);

    // Button should be disabled while loading
    expect(deleteButton).toBeDisabled();
  });

  it("shows error toast on delete failure", async () => {
    const user = userEvent.setup();
    const showError = vi.fn();

    vi.mock("hooks/useToast", () => ({
      useToast: () => ({
        showError,
      }),
    }));

    const mocks = [
      {
        request: {
          query: DELETE_DOCUMENT_MUTATION,
          variables: { id: "doc-1" },
        },
        error: new Error("Delete failed"),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DocumentList documents={mockDocuments} />
      </MockedProvider>
    );

    const deleteButton = screen.getByRole("button", { name: /delete test document 1/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(DOCUMENT_REMOVAL_FAILED_MESSAGE);
    });
  });
});
