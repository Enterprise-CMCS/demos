import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

import {
  ConceptPhase,
  ConceptProps,
  getConceptPhaseComponentFromApplication,
} from "./ConceptPhase";

import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "components/application";
import { LocalDate } from "demos-server";

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

const mockCompletePhase = vi.fn();
const mockSkipConceptPhase = vi.fn();
vi.mock("../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
  }),
  useSkipConceptPhase: () => ({
    skipConceptPhase: mockSkipConceptPhase,
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
  });

  describe("Button Logic", () => {
    it("Finish button is disabled initially", () => {
      setup();
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();
    });

    it("Finish button is enabled when a presubmission document is uploaded and date is populated", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();
    });

    it("Finish button remains disabled when a general document is uploaded even when date is filled", () => {
      const generalDocument: ApplicationWorkflowDocument = {
        id: "2",
        name: "General Document 1",
        description: "Test general document",
        documentType: "General File",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: new Date("2024-01-20"),
      };
      setup({ initialPreSubmissionDocuments: [generalDocument] });

      const dateInput = screen.getByLabelText(/Pre-Submission Document Submitted Date/);
      userEvent.type(dateInput, "2024-02-20");

      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();
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

    it("calls skipConceptPhase mutation on click of skip button", async () => {
      const user = userEvent.setup();
      setup();
      const skipButton = screen.getByRole("button", { name: /skip/i });
      await user.click(skipButton);
      expect(mockSkipConceptPhase).toHaveBeenCalledWith("test-demo-id");
    });

    it("calls completePhase mutation on click of finish button", async () => {
      const user = userEvent.setup();
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const finishButton = screen.getByRole("button", { name: /finish/i });
      await user.click(finishButton);
      expect(mockCompletePhase).toHaveBeenCalledWith({
        applicationId: "test-demo-id",
        phaseName: "Concept",
      });
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
    it("populates date when a presubmission document with createdAt is provided", () => {
      setup({ initialPreSubmissionDocuments: [mockPreSubmissionDocument] });
      const dateInput = screen.getByLabelText(
        /Pre-Submission Document Submitted Date/
      ) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-15");
    });

    it("does not populate date when a general document with createdAt is provided", () => {
      const generalDocument: ApplicationWorkflowDocument = {
        id: "2",
        name: "General Document 1",
        description: "Test general document",
        documentType: "General File",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: new Date("2024-01-20"),
      };
      setup({ initialPreSubmissionDocuments: [generalDocument] });
      const dateInput = screen.getByLabelText(
        /Pre-Submission Document Submitted Date/
      ) as HTMLInputElement;
      expect(dateInput.value).toBe("");
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

  describe("Document Reactivity", () => {
    it("reflects updated documents when props change (no refresh needed)", () => {
      const { rerender } = render(
        <TestProvider>
          <ConceptPhase {...defaultProps} initialPreSubmissionDocuments={[]} />
        </TestProvider>
      );

      expect(screen.getByText("No documents yet.")).toBeInTheDocument();

      rerender(
        <TestProvider>
          <ConceptPhase
            {...defaultProps}
            initialPreSubmissionDocuments={[mockPreSubmissionDocument]}
          />
        </TestProvider>
      );

      expect(screen.queryByText("No documents yet.")).not.toBeInTheDocument();
      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
    });

    it("reflects document removal when props change (no refresh needed)", () => {
      const { rerender } = render(
        <TestProvider>
          <ConceptPhase
            {...defaultProps}
            initialPreSubmissionDocuments={[mockPreSubmissionDocument]}
          />
        </TestProvider>
      );

      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();

      rerender(
        <TestProvider>
          <ConceptPhase {...defaultProps} initialPreSubmissionDocuments={[]} />
        </TestProvider>
      );

      expect(screen.queryByText("Pre-Submission Document 1")).not.toBeInTheDocument();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("updates Finish button state when documents are added via props", () => {
      const { rerender } = render(
        <TestProvider>
          <ConceptPhase
            {...defaultProps}
            initialPreSubmissionDocuments={[]}
            presubmissionSubmittedDate={"2024-01-15" as LocalDate}
          />
        </TestProvider>
      );

      expect(screen.getByRole("button", { name: /finish/i })).toBeDisabled();

      rerender(
        <TestProvider>
          <ConceptPhase
            {...defaultProps}
            initialPreSubmissionDocuments={[mockPreSubmissionDocument]}
            presubmissionSubmittedDate={"2024-01-15" as LocalDate}
          />
        </TestProvider>
      );

      expect(screen.getByRole("button", { name: /finish/i })).toBeEnabled();
    });
  });

  describe("getConceptPhaseComponentFromApplication", () => {
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
        tags: [],
      };

      const component = getConceptPhaseComponentFromApplication(mockDemonstration);
      expect(component).toBeDefined();
      if (component) {
        expect(component.type).toBe(ConceptPhase);
        expect(component.props.demonstrationId).toBe("demo-111");
        expect(component.props.initialPreSubmissionDocuments).toHaveLength(2);
      }
    });

    it("should extract the presubmissionDocumentSubmittedDate if it exists on the phase", () => {
      const mockDemonstration: ApplicationWorkflowDemonstration = {
        id: "demo-222",
        name: "Test Demo 2",
        state: {
          id: "NY",
          name: "New York",
        },
        primaryProjectOfficer: mockPO,
        status: "Pre-Submission",
        currentPhaseName: "Concept",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Concept",
            phaseStatus: "Started",
            phaseDates: [
              {
                dateType: "Pre-Submission Submitted Date",
                dateValue: new Date("2024-03-15"),
              },
            ],
            phaseNotes: [],
          },
        ],
        documents: [],
        demonstrationTypes: [],
        tags: [],
      };

      const component = getConceptPhaseComponentFromApplication(mockDemonstration);
      expect(component).toBeDefined();
      if (component) {
        expect(component.type).toBe(ConceptPhase);
        expect(component.props.presubmissionSubmittedDate).toBe("2024-03-15");
      }
    });

    it("overrides createdAt date on document with Presubmission Document Submitted Date when both provided", () => {
      setup({
        initialPreSubmissionDocuments: [mockPreSubmissionDocument],
        presubmissionSubmittedDate: "2024-01-10" as LocalDate,
      });
      const dateInput = screen.getByLabelText(
        /Pre-Submission Document Submitted Date/
      ) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-10");
    });
  });
});
