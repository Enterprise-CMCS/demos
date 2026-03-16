import "@testing-library/jest-dom";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

import {
  ConceptPhase,
  ConceptPhaseProps,
  getConceptPhaseComponentFromApplication,
  calculatePresubmissionDate,
  UPLOAD_BUTTON_NAME,
  FINISH_BUTTON_NAME,
  SKIP_BUTTON_NAME,
  DATE_PICKER_NAME,
} from "./ConceptPhase";

import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "components/application";
import { DialogProvider } from "components/dialog/DialogContext";

const mockCompletePhase = vi.fn();
const mockSkipConceptPhase = vi.fn();
const mockSetApplicationDate = vi.fn();

vi.mock("components/application/phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
  }),
  useSkipConceptPhase: () => ({
    skipConceptPhase: mockSkipConceptPhase,
  }),
}));

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDate: () => ({
    setApplicationDate: mockSetApplicationDate,
  }),
}));

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

const TEST_APPLICATION_ID = "test-app-id";

const MOCK_DOCUMENT: ApplicationWorkflowDocument = {
  id: "1",
  name: "Pre-Submission Document 1",
  description: "Test pre-submission document",
  documentType: "Pre-Submission",
  phaseName: "Concept",
  owner: { person: { fullName: "John Doe" } },
  createdAt: new Date("2024-01-15"),
};

const DEFAULT_PROPS: ConceptPhaseProps = {
  applicationId: TEST_APPLICATION_ID,
  workflowApplicationType: "demonstration",
  documents: [MOCK_DOCUMENT],
  setSelectedPhase: () => {},
  phaseStatus: "Started",
};

describe("ConceptPhase", () => {
  const setup = (props: Partial<ConceptPhaseProps> = {}) => {
    const renderComponent = (newProps: Partial<ConceptPhaseProps>) => {
      const finalProps = { ...DEFAULT_PROPS, ...newProps };
      return (
        <TestProvider>
          <DialogProvider>
            <ConceptPhase {...finalProps} />
          </DialogProvider>
        </TestProvider>
      );
    };

    const renderResult = render(renderComponent(props));

    const customRerender = (newProps: Partial<ConceptPhaseProps>) => {
      return renderResult.rerender(renderComponent(newProps));
    };

    return { ...renderResult, rerender: customRerender };
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
      const uploadButton = screen.getByTestId(UPLOAD_BUTTON_NAME);
      expect(uploadButton).toBeInTheDocument();
    });

    it("shows 'No documents yet' when no documents", () => {
      setup({ documents: [] });
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("displays Pre-Submission documents when provided", () => {
      setup();
      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup();
      const deleteButton = screen.getByLabelText("Delete Pre-Submission Document 1");
      expect(deleteButton).toBeInTheDocument();
    });

    describe("WorkflowApplicationType text rendering", () => {
      it("renders helper text with 'demonstration' when workflowApplicationType is demonstration", () => {
        setup({ workflowApplicationType: "demonstration" });
        expect(
          screen.getByText(/Upload the Pre-Submission Document describing your demonstration/)
        ).toBeInTheDocument();
      });
      it("renders helper text with 'extension' when workflowApplicationType is extension", () => {
        setup({ workflowApplicationType: "extension" });
        expect(
          screen.getByText(/Upload the Pre-Submission Document describing your extension/)
        ).toBeInTheDocument();
      });

      it("renders helper text with 'amendment' when workflowApplicationType is amendment", () => {
        setup({ workflowApplicationType: "amendment" });
        expect(
          screen.getByText(/Upload the Pre-Submission Document describing your amendment/)
        ).toBeInTheDocument();
      });
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
      const dateInput = screen.getByTestId(DATE_PICKER_NAME);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute("type", "date");
    });
  });

  describe("Button Logic", () => {
    it("Finish button is disabled initially", () => {
      setup({ documents: [] });
      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      expect(finishButton).toBeDisabled();
    });

    it("Finish button is enabled when a presubmission document is uploaded and date is populated", () => {
      setup();
      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
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
      setup({ documents: [generalDocument] });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME);
      userEvent.type(dateInput, "2024-02-20");

      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      expect(finishButton).toBeDisabled();
    });

    it("Skip button is enabled initially when no activity", () => {
      setup({ documents: [] });
      const skipButton = screen.getByTestId(SKIP_BUTTON_NAME);
      expect(skipButton).toBeEnabled();
    });

    it("Skip button is disabled when documents exist", () => {
      setup();
      const skipButton = screen.getByTestId(SKIP_BUTTON_NAME);
      expect(skipButton).toBeDisabled();
    });

    it("calls skipConceptPhase mutation on click of skip button", async () => {
      const user = userEvent.setup();
      setup({ documents: [] });
      const skipButton = screen.getByTestId(SKIP_BUTTON_NAME);
      await user.click(skipButton);
      expect(mockSkipConceptPhase).toHaveBeenCalledWith(TEST_APPLICATION_ID);
    });

    it("calls completePhase mutation on click of finish button", async () => {
      const user = userEvent.setup();
      setup();
      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      await user.click(finishButton);
      expect(mockCompletePhase).toHaveBeenCalledWith({
        applicationId: TEST_APPLICATION_ID,
        phaseName: "Concept",
      });
    });
  });

  describe("Upload Modal", () => {
    it("opens upload modal when upload button clicked", async () => {
      const user = userEvent.setup();
      setup();

      const uploadButton = screen.getByTestId(UPLOAD_BUTTON_NAME);
      await user.click(uploadButton);

      // Dialog should appear in a <dialog> element
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog.tagName).toBe("DIALOG");

      // Verify the dialog contains the pre-submission document title
      expect(dialog).toHaveTextContent("Pre-Submission Document");
    });
  });

  describe("Validation Logic", () => {
    it("shows required asterisk when documents are uploaded", () => {
      setup();

      const dateLabel = screen.getByText(/Pre-Submission Document Submitted Date/);
      const asterisk = dateLabel.parentElement?.querySelector(".text-text-warn");
      expect(asterisk).toBeInTheDocument();
    });

    it("does not show required asterisk when no documents", () => {
      setup({ documents: [] });

      const dateLabel = screen.getByText(/Pre-Submission Document Submitted Date/);
      const asterisk = dateLabel.parentElement?.querySelector(".text-text-warn");
      expect(asterisk).not.toBeInTheDocument();
    });
  });

  describe("Date Field Behavior", () => {
    it("populates date when a presubmission document with createdAt is provided", () => {
      setup();
      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
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
      setup({ documents: [generalDocument] });
      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      expect(dateInput.value).toBe("");
    });

    it("allows user to change date manually", async () => {
      setup({ documents: [] });
      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      await userEvent.type(dateInput, "2024-02-20");
      expect(dateInput.value).toBe("2024-02-20");
    });

    it("sets date to latest pre-submission document createdAt when multiple documents exist", () => {
      const olderDocument: ApplicationWorkflowDocument = {
        id: "older",
        name: "Older Pre-Submission",
        description: "Older doc",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: new Date("2024-01-10"),
      };
      const newerDocument: ApplicationWorkflowDocument = {
        id: "newer",
        name: "Newer Pre-Submission",
        description: "Newer doc",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "Jane Doe" } },
        createdAt: new Date("2024-01-20"),
      };

      setup({ documents: [olderDocument, newerDocument] });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-20");
    });
  });

  describe("calculatePresubmissionDate", () => {
    it("returns initial date if provided, regardless of documents", () => {
      const initialDate = "2024-01-15";
      const documents: ApplicationWorkflowDocument[] = [
        {
          id: "doc1",
          name: "Pre-Submission",
          description: "Test",
          documentType: "Pre-Submission",
          phaseName: "Concept",
          owner: { person: { fullName: "John Doe" } },
          createdAt: new Date("2024-01-20"),
        },
      ];

      const result = calculatePresubmissionDate(initialDate, documents);
      expect(result).toBe(initialDate);
    });

    it("returns empty string when no initial date and no documents", () => {
      const result = calculatePresubmissionDate("", []);
      expect(result).toBe("");
    });

    it("returns empty string when no initial date and no pre-submission documents", () => {
      const otherDocuments: ApplicationWorkflowDocument[] = [
        {
          id: "doc1",
          name: "Other Document",
          description: "Test",
          documentType: "State Application",
          phaseName: "Application Intake",
          owner: { person: { fullName: "John Doe" } },
          createdAt: new Date("2024-01-20"),
        },
      ];

      const result = calculatePresubmissionDate("", otherDocuments);
      expect(result).toBe("");
    });

    it("returns formatted date from latest pre-submission document createdAt", () => {
      const documents: ApplicationWorkflowDocument[] = [
        {
          id: "doc1",
          name: "Older Pre-Submission",
          description: "Test",
          documentType: "Pre-Submission",
          phaseName: "Concept",
          owner: { person: { fullName: "John Doe" } },
          createdAt: new Date("2024-01-10"),
        },
        {
          id: "doc2",
          name: "Newer Pre-Submission",
          description: "Test",
          documentType: "Pre-Submission",
          phaseName: "Concept",
          owner: { person: { fullName: "Jane Doe" } },
          createdAt: new Date("2024-01-20"),
        },
      ];

      const result = calculatePresubmissionDate("", documents);
      expect(result).toBe("2024-01-20");
    });

    it("returns formatted date in YYYY-MM-DD format", () => {
      const documents: ApplicationWorkflowDocument[] = [
        {
          id: "doc1",
          name: "Pre-Submission",
          description: "Test",
          documentType: "Pre-Submission",
          phaseName: "Concept",
          owner: { person: { fullName: "John Doe" } },
          createdAt: new Date("2024-03-05"),
        },
      ];

      const result = calculatePresubmissionDate("", documents);
      expect(result).toBe("2024-03-05");
    });

    it("filters out non-pre-submission documents when calculating date", () => {
      const documents: ApplicationWorkflowDocument[] = [
        {
          id: "doc1",
          name: "Pre-Submission",
          description: "Test",
          documentType: "Pre-Submission",
          phaseName: "Concept",
          owner: { person: { fullName: "John Doe" } },
          createdAt: new Date("2024-01-10"),
        },
        {
          id: "doc2",
          name: "State Application",
          description: "Test",
          documentType: "State Application",
          phaseName: "Application Intake",
          owner: { person: { fullName: "Jane Doe" } },
          createdAt: new Date("2024-02-15"),
        },
      ];

      const result = calculatePresubmissionDate("", documents);
      // Should use pre-submission date, not state application date
      expect(result).toBe("2024-01-10");
    });
  });

  describe("Date Auto-Population on Document Upload/Removal", () => {
    it("displays calculated date from document creation date when documents exist", () => {
      // Document with specific creation date
      const documentCreatedAt = new Date("2026-03-10T10:00:00");
      const newDocument: ApplicationWorkflowDocument = {
        id: "new-doc",
        name: "New Pre-Submission",
        description: "Newly uploaded",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: documentCreatedAt,
      };

      setup({ documents: [newDocument] });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;

      // Date should be calculated from document's createdAt
      expect(dateInput.value).toBe("2026-03-10");
    });

    it("does not change date when a pre-submission document is uploaded but date already exists", async () => {
      const existingDate = "2024-01-10";
      const { rerender } = setup({
        documents: [],
        initialPresubmissionSubmittedDate: existingDate,
      });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      expect(dateInput.value).toBe(existingDate);

      // Simulate document upload
      const newDocument: ApplicationWorkflowDocument = {
        id: "new-doc",
        name: "New Pre-Submission",
        description: "Newly uploaded",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: new Date(),
      };

      rerender({
        documents: [newDocument],
        initialPresubmissionSubmittedDate: existingDate,
      });

      await waitFor(() => {
        // Date should remain unchanged
        expect(dateInput.value).toBe(existingDate);
      });
    });

    it("displays empty date when no documents and no initial date", () => {
      setup({ documents: [] });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;

      expect(dateInput.value).toBe("");
    });

    it("keeps initial date when provided, regardless of documents", () => {
      const initialDate = "2024-01-15";

      // With documents but initial date takes precedence
      setup({
        documents: [MOCK_DOCUMENT],
        initialPresubmissionSubmittedDate: initialDate,
      });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;

      expect(dateInput.value).toBe(initialDate);
    });

    it("allows user to override calculated date via datepicker", async () => {
      setup({ documents: [MOCK_DOCUMENT] });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;

      // Initially shows calculated date from document
      expect(dateInput.value).toBe("2024-01-15");

      // User manually changes the date using fireEvent (date inputs require this)
      fireEvent.input(dateInput, { target: { value: "2024-02-20" } });
      // Date should now show the user's override
      await waitFor(() => {
        expect(dateInput.value).toBe("2024-02-20");
      });
    });

    it("does not clear date when removing a document but other pre-submission documents remain", async () => {
      const doc1: ApplicationWorkflowDocument = {
        id: "doc1",
        name: "Pre-Submission 1",
        description: "First doc",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "John Doe" } },
        createdAt: new Date("2024-01-10"),
      };
      const doc2: ApplicationWorkflowDocument = {
        id: "doc2",
        name: "Pre-Submission 2",
        description: "Second doc",
        documentType: "Pre-Submission",
        phaseName: "Concept",
        owner: { person: { fullName: "Jane Doe" } },
        createdAt: new Date("2024-01-15"),
      };

      const { rerender } = setup({
        documents: [doc1, doc2],
        initialPresubmissionSubmittedDate: "2024-01-15",
      });

      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-15");

      // Remove one document but keep the other
      rerender({
        documents: [doc2],
        initialPresubmissionSubmittedDate: "2024-01-15",
      });

      await waitFor(() => {
        // Date should remain
        expect(dateInput.value).toBe("2024-01-15");
      });
    });
  });

  describe("Document Reactivity", () => {
    it("reflects updated documents when props change (no refresh needed)", () => {
      const { rerender } = setup({ documents: [] });

      expect(screen.getByText("No documents yet.")).toBeInTheDocument();

      rerender({ documents: [MOCK_DOCUMENT] });

      expect(screen.queryByText("No documents yet.")).not.toBeInTheDocument();
      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();
    });

    it("reflects document removal when props change (no refresh needed)", () => {
      const { rerender } = setup({ documents: [MOCK_DOCUMENT] });

      expect(screen.getByText("Pre-Submission Document 1")).toBeInTheDocument();

      rerender({ documents: [] });

      expect(screen.queryByText("Pre-Submission Document 1")).not.toBeInTheDocument();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("updates Finish button state when documents are removed via props", async () => {
      // Start with documents and date - button should be enabled
      const { rerender } = setup({
        documents: [MOCK_DOCUMENT],
        initialPresubmissionSubmittedDate: "2024-01-15",
      });

      // Button should be enabled initially
      await waitFor(() => {
        expect(screen.getByTestId(FINISH_BUTTON_NAME)).toBeEnabled();
      });

      // Remove documents - button should become disabled
      rerender({
        documents: [],
        initialPresubmissionSubmittedDate: "2024-01-15",
      });

      await waitFor(() => {
        expect(screen.getByTestId(FINISH_BUTTON_NAME)).toBeDisabled();
      });
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

      const component = getConceptPhaseComponentFromApplication(
        mockDemonstration,
        "demonstration",
        () => {}
      );
      expect(component).toBeDefined();
      if (component) {
        expect(component.type).toBe(ConceptPhase);
        expect(component.props.demonstrationId).toBe("demo-111");
        expect(component.props.documents).toHaveLength(2);
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

      const component = getConceptPhaseComponentFromApplication(
        mockDemonstration,
        "demonstration",
        () => {}
      );
      expect(component).toBeDefined();
      if (component) {
        expect(component.type).toBe(ConceptPhase);
        expect(component.props.initialPresubmissionSubmittedDate).toBe("2024-03-15");
      }
    });

    it("overrides createdAt date on document with Presubmission Document Submitted Date when both provided", () => {
      setup({
        documents: [MOCK_DOCUMENT],
        initialPresubmissionSubmittedDate: "2024-01-10",
      });
      const dateInput = screen.getByTestId(DATE_PICKER_NAME) as HTMLInputElement;
      expect(dateInput.value).toBe("2024-01-10");
    });
  });
});
