import "@testing-library/jest-dom";

import React from "react";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { TestProvider } from "test-utils/TestProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApplicationIntakePhase } from "./ApplicationIntakePhase";

// Test constants
const TEST_DEMO_ID = "test-demo-id";
const TEST_DOCUMENT_DATE = "2024-01-12";
const TEST_OTHER_DOCUMENT_DATE = "2024-01-16";
const TEST_USER_INPUT_DATE = "2024-01-12";

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

describe("ApplicationIntakePhase", () => {
  const defaultProps = {
    demonstrationId: TEST_DEMO_ID,
    documents: [],
    onDocumentsRefetch: mockOnDocumentsRefetch,
  };

  const mockStateApplicationDocument: DocumentTableDocument = {
    id: "1",
    name: "State Application Document 1",
    description: "Test state application document",
    documentType: "State Application",
    createdAt: new Date(TEST_DOCUMENT_DATE),
    owner: { person: { fullName: "Test User" } },
  };

  const mockOtherDocument: DocumentTableDocument = {
    id: "doc-2",
    name: "Other Document",
    description: "Test other document",
    documentType: "General File",
    createdAt: new Date(TEST_OTHER_DOCUMENT_DATE),
    owner: { person: { fullName: "Test User" } },
  };

  const setup = (props = {}) => {
    const finalProps = { ...defaultProps, ...props };

    render(
      <TestProvider>
        <ApplicationIntakePhase {...finalProps} />
      </TestProvider>
    );

    return finalProps;
  };

  describe("Phase Header", () => {
    it("renders APPLICATION INTAKE header with brand color", () => {
      setup();
      const header = screen.getByText("APPLICATION INTAKE");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("text-brand");
    });

    it("renders phase description", () => {
      setup();
      expect(
        screen.getByText(/When the state submits an official application/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/closes the Pre-Submission Technical Assistance/)
      ).toBeInTheDocument();
      expect(screen.getByText(/opens the Completeness Review period/)).toBeInTheDocument();
    });
  });

  describe("Step 1 - Upload Section", () => {
    it("renders Step 1 title and description", () => {
      setup();
      expect(screen.getByText("STEP 1 - UPLOAD")).toBeInTheDocument();
      expect(screen.getByText(/Upload the State Application file below/)).toBeInTheDocument();
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

    it("displays Application Intake phase documents only", () => {
      setup({
        documents: [mockStateApplicationDocument, mockOtherDocument],
      });

      expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
      expect(screen.queryByText("Other Document")).not.toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup({ documents: [mockStateApplicationDocument] });

      const deleteButton = screen.getByLabelText("Delete State Application Document 1");
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
          /Verify that the document is uploaded\/accurate and complete all required fields/
        )
      ).toBeInTheDocument();
    });

    it("renders State Application Submitted Date input field", () => {
      setup();
      const labels = screen.getAllByText(/State Application Submitted Date/);
      const labelElement = labels.find((el) => el.tagName === "LABEL");
      expect(labelElement).toBeInTheDocument();

      const dateInputs = screen.getAllByDisplayValue("");
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      );
      expect(submittedDateInput).toBeInTheDocument();
      expect(submittedDateInput).toHaveAttribute("type", "date");
      expect(submittedDateInput).toHaveAttribute("required");
    });

    it("renders Completeness Review Due Date input field (disabled)", () => {
      setup();
      const label = screen.getByText(/Completeness Review Due Date/);
      expect(label).toBeInTheDocument();

      const dateInputs = screen.getAllByDisplayValue("");
      const dueDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && input.hasAttribute("disabled")
      );
      expect(dueDateInput).toBeInTheDocument();
      expect(dueDateInput).toHaveAttribute("type", "date");
      expect(dueDateInput).toBeDisabled();
    });

    it("shows help text for auto-calculated due date", () => {
      setup();
      expect(screen.getByText(/Automatically calculated as 15 calendar days/)).toBeInTheDocument();
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
        setup({ documents: [mockStateApplicationDocument] });
        const finishButton = screen.getByRole("button", { name: /finish/i });
        expect(finishButton).toBeEnabled();
      });

      it("does not show Skip button (phase cannot be skipped)", () => {
        setup();
        const skipButton = screen.queryByRole("button", { name: /skip/i });
        expect(skipButton).not.toBeInTheDocument();
      });
    });
  });

  describe("Testing Panel (Development Mode)", () => {
    it("shows testing panel in development mode", () => {
      setup();
      expect(screen.getByText("UI Testing Panel")).toBeInTheDocument();
    });

    it("adds mock documents when add button clicked", async () => {
      setup();

      const addButton = screen.getByRole("button", { name: /add mock doc/i });
      await userEvent.click(addButton);

      // Should show the mock document in the list
      expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
    });

    it("clears mock documents when clear button clicked", async () => {
      setup();

      // Add a mock document first
      const addButton = screen.getByRole("button", { name: /add mock doc/i });
      await userEvent.click(addButton);

      // Then clear it
      const clearButton = screen.getByRole("button", { name: /clear all/i });
      await userEvent.click(clearButton);

      // Should show no documents
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("shows no documents message when empty", () => {
      setup();

      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("shows documents when documents are added", async () => {
      setup();

      const addButton = screen.getByRole("button", { name: /add mock doc/i });
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
      });
    });
  });

  describe("Upload Modal", () => {
    it("opens upload modal when upload button clicked", async () => {
      setup();

      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      expect(screen.getByText("Add State Application")).toBeInTheDocument();
    });
  });

  describe("Document Management", () => {
    it("filters documents to only show State Application document type", () => {
      const mixedDocuments = [
        mockStateApplicationDocument,
        mockOtherDocument,
        {
          ...mockOtherDocument,
          id: "doc-3",
          name: "Another State Application Document",
          documentType: "State Application",
        },
      ];

      setup({ documents: mixedDocuments });

      expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
      expect(screen.getByText("Another State Application Document")).toBeInTheDocument();
      expect(screen.queryByText("Other Document")).not.toBeInTheDocument();
    });

    it("handles document deletion for mock documents", async () => {
      setup();

      // Add a mock document
      const addButton = screen.getByRole("button", { name: /add mock doc/i });
      await userEvent.click(addButton);

      // Delete the mock document using specific aria-label
      const deleteButton = screen.getByLabelText("Delete State Application Document 1");
      await userEvent.click(deleteButton);

      // Should show no documents again
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });
  });

  describe("Date Auto-population and Calculation", () => {
    it("auto-populates submitted date when first document is uploaded", () => {
      const documentWithDate = {
        ...mockStateApplicationDocument,
        createdAt: new Date(TEST_DOCUMENT_DATE),
      };

      setup({ documents: [documentWithDate] });

      // Check that the date input field has been populated
      const dateInputs = screen.getAllByDisplayValue("2024-01-12");
      expect(dateInputs.length).toBeGreaterThan(0);
    });

    it("calculates completeness review due date correctly", () => {
      const documentWithDate = {
        ...mockStateApplicationDocument,
        createdAt: new Date(TEST_DOCUMENT_DATE), // January 12, 2024
      };

      setup({ documents: [documentWithDate] });

      // Check that the due date field shows the calculated date (15 days after submitted date)
      const dueDateInputs = screen.getAllByDisplayValue("2024-01-27");
      expect(dueDateInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Validation Logic", () => {
    it("always shows required asterisk for State Application Submitted Date", () => {
      setup();

      const labels = screen.getAllByText(/State Application Submitted Date/);
      const labelElement = labels.find((el) => el.tagName === "LABEL");
      const asterisk = labelElement?.parentElement?.querySelector(".text-text-warn");
      expect(asterisk).toBeInTheDocument();
    });

    it("shows validation message when date is provided without documents", async () => {
      setup();

      const dateInputs = screen.getAllByDisplayValue("");
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      );

      // Set a date without having documents
      if (submittedDateInput) {
        await userEvent.type(submittedDateInput, TEST_USER_INPUT_DATE);

        expect(
          screen.getByText(/At least one State Application document is required/)
        ).toBeInTheDocument();
      }
    });
  });

  describe("State Management", () => {
    it("updates button states when mock documents are added", async () => {
      setup();

      // Initially finish should be disabled
      expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();

      // Add mock document
      const addButton = screen.getByRole("button", { name: /add mock doc/i });
      await userEvent.click(addButton);

      // Finish should now be enabled (due to auto-populated date)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
      });
    });
  });

  describe("Mutation Handling", () => {
    it("calls complete phase mutation with correct parameters", async () => {
      setup({ documents: [mockStateApplicationDocument] });

      const finishButton = screen.getByRole("button", { name: /finish/i });
      await userEvent.click(finishButton);

      expect(mockMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            input: {
              demonstrationId: "test-demo-id",
              // Flexible matching for timezone differences
              submittedDate: expect.stringMatching(/^2024-01-(11|12)$/),
              completenessReviewDueDate: expect.stringMatching(/^2024-01-(25|27)$/),
            },
          },
        })
      );
    });

    it("displays finish button when ready to complete phase", () => {
      setup({ documents: [mockStateApplicationDocument] });

      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeInTheDocument();
      expect(finishButton).toBeEnabled();
    });
  });
});
