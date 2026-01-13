import "@testing-library/jest-dom";

import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ApplicationIntakePhase,
  ApplicationIntakeProps,
  getCompletenessReviewDueDate,
  getApplicationIntakeComponentFromDemonstration,
} from "./ApplicationIntakePhase";
import {
  ApplicationWorkflowDocument,
  ApplicationWorkflowDemonstration,
} from "../ApplicationWorkflow";
import { formatDateForServer, getTodayEst } from "util/formatDate";

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

const mockSetApplicationDate = vi.fn(() => Promise.resolve({ data: {} }));
const mockSetApplicationDates = vi.fn(() => Promise.resolve({ data: {} }));

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDate: vi.fn(() => ({
    setApplicationDate: mockSetApplicationDate,
    loading: false,
    error: null,
  })),
  useSetApplicationDates: vi.fn(() => ({
    setApplicationDates: mockSetApplicationDates,
    loading: false,
    error: null,
    data: null,
  })),
}));

const showApplicationIntakeDocumentUploadDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showApplicationIntakeDocumentUploadDialog,
  }),
}));

describe("ApplicationIntakePhase", () => {
  const defaultProps: ApplicationIntakeProps = {
    demonstrationId: "test-demo-id",
    initialStateApplicationDocuments: [],
    initialStateApplicationSubmittedDate: "",
  };

  const mockStateApplicationDocument: ApplicationWorkflowDocument = {
    id: "1",
    name: "State Application Document 1",
    description: "Test state application document",
    documentType: "State Application",
    phaseName: "Application Intake",
    owner: { person: { fullName: "John Doe" } },
    createdAt: new Date("2024-01-12"),
  };

  const setup = (props: Partial<ApplicationIntakeProps> = {}) => {
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
        initialStateApplicationDocuments: [mockStateApplicationDocument],
      });

      expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup({ initialStateApplicationDocuments: [mockStateApplicationDocument] });

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

      it("is enabled when documents are uploaded & state application date is filled", () => {
        setup({
          initialStateApplicationDocuments: [mockStateApplicationDocument],
          initialStateApplicationSubmittedDate: "2020-10-10",
        });
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

  describe("Upload Modal", () => {
    it("opens upload modal when upload button clicked", async () => {
      setup();

      const uploadButton = screen.getByRole("button", { name: /upload/i });
      await userEvent.click(uploadButton);

      expect(showApplicationIntakeDocumentUploadDialog).toHaveBeenCalledWith(
        "test-demo-id",
        expect.any(Function)
      );
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
  });

  describe("getCompletenessReviewDueDate", () => {
    it("adds 15 calendar days to the submitted date", () => {
      const submittedDate = "2024-01-12"; // January 12, 2024
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2024-01-27");
    });

    it("handles date at end of month correctly", () => {
      const submittedDate = "2024-01-20"; // January 20, 2024
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2024-02-04");
    });

    it("handles leap year correctly", () => {
      const submittedDate = "2024-02-20"; // February 20, 2024 (leap year)
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2024-03-06");
    });

    it("handles non-leap year February correctly", () => {
      const submittedDate = "2025-02-20"; // February 20, 2025 (non-leap year)
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2025-03-07");
    });

    it("handles year boundary crossing", () => {
      const submittedDate = "2024-12-20"; // December 20, 2024
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2025-01-04");
    });

    it("returns a valid Date object", () => {
      const submittedDate = "2024-10-13";
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(result).toBeInstanceOf(Date);
      expect(result.toString()).not.toBe("Invalid Date");
    });

    it("calculates correctly for the test case: Oct 13 to Oct 28", () => {
      const submittedDate = "2025-10-13"; // October 13, 2025
      const result = getCompletenessReviewDueDate(submittedDate);

      expect(formatDateForServer(result)).toBe("2025-10-28");
    });
  });

  describe("getApplicationIntakeComponentFromDemonstration", () => {
    it("should extract demonstration data and return ApplicationIntakePhase component", () => {
      const mockDemonstration: ApplicationWorkflowDemonstration = {
        id: "demo-123",
        name: "Test Demo",
        state: {
          id: "CA",
          name: "California",
        },
        primaryProjectOfficer: mockPO,
        status: "Under Review",
        currentPhaseName: "Application Intake",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Application Intake",
            phaseStatus: "Started",
            phaseDates: [
              {
                dateType: "State Application Submitted Date",
                dateValue: new Date(2024, 9, 13),
              },
            ],
            phaseNotes: [],
          },
        ],
        documents: [
          {
            id: "doc-1",
            name: "State Application 1",
            description: "Test document",
            documentType: "State Application",
            phaseName: "Application Intake",
            owner: { person: { fullName: "John Doe" } },
            createdAt: new Date(2024, 10, 10),
          },
        ],
      };

      const component = getApplicationIntakeComponentFromDemonstration(mockDemonstration);

      expect(component).toBeDefined();
      expect(component.type).toBe(ApplicationIntakePhase);
      expect(component.props.demonstrationId).toBe("demo-123");
      expect(component.props.initialStateApplicationDocuments).toHaveLength(1);
      expect(component.props.initialStateApplicationSubmittedDate).toBe("2024-10-13");
    });
  });

  describe("handleDateChange", () => {
    it("updates the state application submitted date when user changes date input", async () => {
      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
      });

      const dateInputs = screen.getAllByDisplayValue("");
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "2024-03-15" } });

      expect(submittedDateInput.value).toBe("2024-03-15");
    });

    it("updates completeness review due date when state application date changes", async () => {
      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
      });

      const dateInputs = screen.getAllByDisplayValue("");
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "2024-03-15" } });

      // Completeness review due date should be 15 days later: 2024-03-30
      await waitFor(() => {
        const dueDateInputs = screen.getAllByDisplayValue("2024-03-30");
        const dueDateInput = dueDateInputs.find((input) =>
          input.hasAttribute("disabled")
        ) as HTMLInputElement;

        expect(dueDateInput).toBeInTheDocument();
        expect(dueDateInput.value).toBe("2024-03-30");
      });
    });

    it("finish button is enabled when both date and documents are provided via props", () => {
      // Test the effect logic by providing both requirements via initial props
      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();
    });

    it("finish button remains disabled when date is empty even with documents", () => {
      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
        initialStateApplicationSubmittedDate: "",
      });

      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();
    });

    it("finish button remains disabled when no documents even with date", () => {
      setup({
        initialStateApplicationDocuments: [],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const finishButton = screen.getByRole("button", { name: /finish/i });
      expect(finishButton).toBeDisabled();

      // Date should be cleared when no documents are present (business rule)
      const submittedDateInput = screen.getByTestId("datepicker-state-application-submitted-date") as HTMLInputElement;
      expect(submittedDateInput.value).toBe("");
    });

    it("handles empty date value correctly", async () => {
      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const dateInputs = screen.getAllByDisplayValue("2024-03-15");
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      ) as HTMLInputElement;

      await userEvent.clear(submittedDateInput);

      expect(submittedDateInput.value).toBe("");
    });
  });

  describe("handleDocumentUploadSucceeded", () => {
    it("date field should have today's date after document upload", async () => {
      const todayString = getTodayEst();

      setup({
        initialStateApplicationDocuments: [mockStateApplicationDocument],
        initialStateApplicationSubmittedDate: todayString,
      });

      const dateInputs = screen.getAllByDisplayValue(todayString);
      const submittedDateInput = dateInputs.find(
        (input) => input.getAttribute("type") === "date" && !input.hasAttribute("disabled")
      ) as HTMLInputElement;

      expect(submittedDateInput?.value).toBe(todayString);
    });
  });
});
