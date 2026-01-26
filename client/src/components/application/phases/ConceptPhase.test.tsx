import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

import {
  ConceptPhase,
  ConceptProps,
  getConceptPhaseComponentFromDemonstration,
} from "./ConceptPhase";

import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(() => [
      vi.fn(() => Promise.resolve({ data: {} })),
      { loading: false, error: null },
    ]),
  };
});

const showConceptPreSubmissionDocumentUploadDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showConceptPreSubmissionDocumentUploadDialog,
  }),
}));

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

describe("ConceptPhase", () => {
  const defaultProps: ConceptProps = {
    demonstrationId: "test-demo-id",
    initialPreSubmissionDocuments: [],
  };

  const mockPreSubmissionDocument: ApplicationWorkflowDocument = {
    id: "1",
    name: "Pre-Submission Document 1",
    description: "Test pre-submission document",
    documentType: "Pre-Submission",
    phaseName: "Concept",
    owner: { person: { fullName: "John Doe" } },
    createdAt: new Date("2024-01-15"),
  };

  const setup = (props: Partial<ConceptProps> = {}) => {
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
      expect(
        screen.getByText(/Upload the Pre-Submission Document describing your demonstration/)
      ).toBeInTheDocument();
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

    it("displays Pre-Submission documents when provided", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
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
        screen.getByText(/Verify that the document is uploaded\/accurate/)
      ).toBeInTheDocument();
    });

    it("renders date input field", () => {
      setup();
      const dateInput = screen.getByLabelText(/Pre-Submission Document Submitted Date/);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });

    it("renders Demonstration Type dropdown", () => {
      setup();
      expect(screen.getByText(/Demonstration Type\(s\) Requested/)).toBeInTheDocument();
    });
  });

  describe("Button Logic", () => {
    it("Finish button is disabled initially", () => {
      setup();
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();
    });

    it("Finish button is enabled when documents are uploaded and date is populated", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();
    });

    it("Skip button is enabled initially when no activity", () => {
      setup();
      const skipButton = screen.getByRole("button", { name: /skip/i });
      expect(skipButton).toBeEnabled();
    });

    it("Skip button is disabled when documents exist", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const skipButton = screen.getByRole("button", { name: /skip/i });
      expect(skipButton).toBeDisabled();
    });
  });

  describe("Upload Modal", () => {
    it("opens upload modal when upload button clicked", async () => {
      setup();

      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      expect(showConceptPreSubmissionDocumentUploadDialog).toHaveBeenCalledWith(
        "test-demo-id",
        expect.any(Function)
      );
    });
  });

  describe("Validation Logic", () => {
    it("shows required asterisk when documents are uploaded", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });

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

  describe("Date Field Behavior", () => {
    it("populates date when a document with createdAt is provided", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const dateInput = screen.getByLabelText(
        /Pre-Submission Document Submitted Date/
      ) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-15");
    });

    it("allows user to change date manually", async () => {
      setup();
      const dateInput = screen.getByLabelText(
        /Pre-Submission Document Submitted Date/
      ) as HTMLInputElement;
      await userEvent.type(dateInput, "2024-02-20");
      expect(dateInput.value).toBe("2024-02-20");
    });
  });

  describe("getConceptPhaseComponentFromDemonstration", () => {
    it("should return ConceptPhase component with extracted pre-submission docs", () => {
      const mockDemonstration: ApplicationWorkflowDemonstration = {
        id: "demo-111",
        name: "Test Demo",
        state: {
          id: "CA",
          name: "California",
        },
        primaryProjectOfficer: mockPO,
        status: "Pre-Submission",
        currentPhaseName: "Concept",
        clearanceLevel: "CMS (OSORA)",
        phases: [],
        documents: [
          {
            id: "d1",
            name: "Pre-Sub 1",
            description: "desc",
            documentType: "Pre-Submission",
            phaseName: "Concept",
            owner: { person: { fullName: "John Doe" } },
            createdAt: new Date("2024-04-01"),
          },
          {
            id: "d2",
            name: "General Doc",
            description: "i am included now",
            documentType: "General File",
            phaseName: "Concept",
            owner: { person: { fullName: "John Doe" } },
            createdAt: new Date("2024-04-02"),
          },
          {
            id: "d3",
            name: "FBNF Workbook",
            description: "ignore me",
            documentType: "Final Budget Neutrality Formulation Workbook",
            phaseName: "Approval Package",
            owner: { person: { fullName: "John Doe" } },
            createdAt: new Date("2024-04-02"),
          },
          {
            id: "d3",
            name: "FBNF Workbook",
            description: "ignore me",
            documentType: "Final Budget Neutrality Formulation Workbook",
            phaseName: "Approval Package",
            owner: { person: { fullName: "John Doe" } },
            createdAt: new Date("2024-04-02"),
          },
        ],
        demonstrationTypes: [],
      };

      const component = getConceptPhaseComponentFromDemonstration(mockDemonstration);
      expect(component).toBeDefined();
      expect(component.type).toBe(ConceptPhase);
      expect(component.props.demonstrationId).toBe("demo-111");
      expect(component.props.initialPreSubmissionDocuments).toHaveLength(2);
    });
  });
});
