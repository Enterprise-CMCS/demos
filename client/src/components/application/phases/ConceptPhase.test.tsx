import "@testing-library/jest-dom";

import React from "react";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { TestProvider } from "test-utils/TestProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConceptPhase } from "./ConceptPhase";

const mockMutation = vi.fn();
const mockOnDocumentsRefetch = vi.fn();

// Mock isLocalDevelopment to return true for testing panel
vi.mock("config/env", async () => {
  const actual = await vi.importActual("config/env");
  return {
    ...actual,
    isLocalDevelopment: vi.fn(() => true),
  };
});

beforeEach(() => {
  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockMutation, { loading: false }],
    };
  });

  // Mock NODE_ENV for testing panel
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("ConceptPhase", () => {
  const defaultProps = {
    applicationId: "test-application-id",
    demonstrationId: "test-demo-id",
    documents: [],
    onDocumentsRefetch: mockOnDocumentsRefetch,
  };

  const mockPreSubmissionDocument: DocumentTableDocument = {
    id: "doc-1",
    name: "Pre-Submission Document 1",
    description: "Test pre-submission document",
    documentType: "Pre-Submission",
    createdAt: new Date("2024-01-15"),
    owner: { person: { fullName: "Test User" } },
  };

  const mockOtherDocument: DocumentTableDocument = {
    id: "doc-2",
    name: "Other Document",
    description: "Test other document",
    documentType: "General File",
    createdAt: new Date("2024-01-16"),
    owner: { person: { fullName: "Test User" } },
  };

  const setup = (props = {}) => {
    const finalProps = { ...defaultProps, ...props };

    render(
      <TestProvider>
        <ConceptPhase {...finalProps} />
      </TestProvider>
    );

    return finalProps;
  };

  describe("Phase Header", () => {
    it("renders CONCEPT header with brand color", () => {
      setup();
      const header = screen.getByText("CONCEPT");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders phase description", () => {
      setup();
      expect(
        screen.getByText(/Pre-Submission Consultation and Technical Assistance/)
      ).toBeInTheDocument();
    });
  });

  describe("Step 1 - Upload Section", () => {
    it("renders Step 1 title and description", () => {
      setup();
      expect(screen.getByText("STEP 1 - UPLOAD")).toBeInTheDocument();
      expect(screen.getByText(/Upload the Pre-Submission Document/)).toBeInTheDocument();
    });

    it("renders upload button", () => {
      setup();
      const uploadButton = screen.getByRole("button", { name: /upload/i });
      expect(uploadButton).toBeInTheDocument();
    });

    it("shows 'No documents yet' when no documents", () => {
      setup();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("displays Pre-Submission documents only", () => {
      setup({
        documents: [mockPreSubmissionDocument, mockOtherDocument],
      });

      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
      expect(screen.queryByText("Other Document")).not.toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup({ documents: [mockPreSubmissionDocument] });

      const deleteButton = screen.getByLabelText("Delete Pre-Submission Document 1");
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Step 2 - Verify/Complete Section", () => {
    it("renders Step 2 title and description", () => {
      setup();
      expect(screen.getByText("Step 2 - Verify/Complete")).toBeInTheDocument();
      expect(screen.getByText("VERIFY/COMPLETE")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Verify that the document is uploaded\/accurate and that all the required fields are filled/
        )
      ).toBeInTheDocument();
    });

    it("renders date input field", () => {
      setup();
      const dateInputs = screen.getAllByDisplayValue("");
      const dateInput = dateInputs.find((input) => input.getAttribute("type") === "date");
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("renders demonstration type dropdown", () => {
      setup();
      expect(screen.getByText(/Demonstration Type\(s\) Requested/)).toBeInTheDocument();
    });
  });

  describe("Button Logic", () => {
    describe("Finish Button", () => {
      it("is disabled initially", () => {
        setup();
        const finishButton = screen.getByRole("button", { name: /finish/i });
        expect(finishButton).toBeDisabled();
      });

      it("is enabled when documents are uploaded (date auto-populated)", () => {
        setup({ documents: [mockPreSubmissionDocument] });
        const finishButton = screen.getByRole("button", { name: /finish/i });
        expect(finishButton).toBeEnabled();
      });
    });

    describe("Skip Button", () => {
      it("is enabled initially", () => {
        setup();
        const skipButton = screen.getByRole("button", { name: /skip/i });
        expect(skipButton).toBeEnabled();
      });

      it("is disabled when documents are uploaded", () => {
        setup({ documents: [mockPreSubmissionDocument] });
        const skipButton = screen.getByRole("button", { name: /skip/i });
        expect(skipButton).toBeDisabled();
      });

      it("logs skip action when clicked", async () => {
        const consoleSpy = vi.spyOn(console, "log");
        setup();

        const skipButton = screen.getByRole("button", { name: /skip/i });
        await userEvent.click(skipButton);

        expect(consoleSpy).toHaveBeenCalledWith(
          "Skipping Concept Phase - navigate to Application Intake"
        );
      });
    });
  });

  describe("Testing Panel (Development Mode)", () => {
    it("shows testing panel in development mode", () => {
      setup();
      expect(screen.getByText("Testing Panel (Development Only)")).toBeInTheDocument();
    });

    it("adds mock documents when add button clicked", async () => {
      setup();

      const addButton = screen.getByRole("button", { name: /add mock pre-submission doc/i });
      await userEvent.click(addButton);

      // Should show the mock document in the list
      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
    });

    it("clears mock documents when clear button clicked", async () => {
      setup();

      // Add a mock document first
      const addButton = screen.getByRole("button", { name: /add mock pre-submission doc/i });
      await userEvent.click(addButton);

      // Then clear it
      const clearButton = screen.getByRole("button", { name: /clear all mock docs/i });
      await userEvent.click(clearButton);

      // Should show no documents
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("shows current state information", () => {
      setup();

      expect(screen.getByText(/Has Pre-Submission Docs: ❌ No/)).toBeInTheDocument();
      expect(screen.getByText(/Date Populated: ❌ No/)).toBeInTheDocument();
      expect(screen.getByText(/Finish Enabled: ❌ No/)).toBeInTheDocument();
      expect(screen.getByText(/Skip Enabled: ✅ Yes/)).toBeInTheDocument();
    });
  });

  describe("Upload Modal", () => {
    it("opens upload modal when upload button clicked", async () => {
      setup();

      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      expect(screen.getByText("Pre-Submission Document")).toBeInTheDocument();
    });
  });

  describe("Document Management", () => {
    it("filters documents to only show Pre-Submission type", () => {
      const mixedDocuments = [
        mockPreSubmissionDocument,
        mockOtherDocument,
        {
          ...mockOtherDocument,
          id: "doc-3",
          name: "Another Pre-Submission Document",
          documentType: "Pre-Submission" as const,
        },
      ];

      setup({ documents: mixedDocuments });

      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
      expect(screen.getByText("Another Pre-Submission Document")).toBeInTheDocument();
      expect(screen.queryByText("Other Document")).not.toBeInTheDocument();
    });

    it("handles document deletion for mock documents", async () => {
      setup();

      // Add a mock document
      const addButton = screen.getByRole("button", { name: /add mock pre-submission doc/i });
      await userEvent.click(addButton);

      // Delete the mock document using specific aria-label
      const deleteButton = screen.getByLabelText("Delete Pre-Submission Document 1");
      await userEvent.click(deleteButton);

      // Should show no documents again
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });
  });

  describe("Date Auto-population", () => {
    it("auto-populates date when first document is uploaded", () => {
      const documentWithDate = {
        ...mockPreSubmissionDocument,
        createdAt: new Date("2024-01-15"),
      };

      setup({ documents: [documentWithDate] });

      // Check that the testing panel shows the date was populated
      expect(screen.getByText(/Date Populated: ✅ Yes/)).toBeInTheDocument();
    });
  });

  describe("Validation Logic", () => {
    it("shows required asterisk when documents are uploaded", () => {
      setup({ documents: [mockPreSubmissionDocument] });

      const dateLabel = screen.getByText(/Pre-Submission Document Submitted Date/);
      const asterisk = dateLabel.parentElement?.querySelector(".text-text-warn");
      expect(asterisk).toBeInTheDocument();
    });

    it("does not show required asterisk when no documents", () => {
      setup();

      const dateLabel = screen.getByText(/Pre-Submission Document Submitted Date/);
      const asterisk = dateLabel.parentElement?.querySelector(".text-text-warn");
      expect(asterisk).not.toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("updates button states when mock documents are added", async () => {
      setup();

      // Initially skip should be enabled, finish disabled
      expect(screen.getByRole("button", { name: /skip/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();

      // Add mock document
      const addButton = screen.getByRole("button", { name: /add mock pre-submission doc/i });
      await userEvent.click(addButton);

      // Skip should now be disabled, finish should be enabled (due to auto-populated date)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /skip/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
      });
    });
  });
});
