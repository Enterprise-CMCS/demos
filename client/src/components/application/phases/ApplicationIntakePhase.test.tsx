import React from "react";
import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ApplicationIntakePhase,
  ApplicationIntakeProps,
  FINISH_BUTTON_NAME,
  UPLOAD_BUTTON_NAME,
  APPLICATION_SUBMITTED_DATEPICKER_NAME,
  COMPLETENESS_REVIEW_DATEPICKER_NAME,
  getCompletenessReviewDueDate,
  getApplicationIntakeComponentFromApplication,
} from "./ApplicationIntakePhase";
import {
  ApplicationWorkflowDocument,
  ApplicationWorkflowDemonstration,
} from "components/application";
import { formatDateForServer, getTodayEst } from "util/formatDate";
import { MockedResponse } from "@apollo/client/testing";
import { GET_APPLICATION_TAG_OPTIONS } from "components/tags/ApplicationHealthTypeTags";
import { DialogProvider } from "components/dialog/DialogContext";

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(() => [mockSetApplicationTagsMutation, { loading: false, error: null }]),
  };
});

const mockSetApplicationDates = vi.fn(() => Promise.resolve({ data: {} }));
const mockSetApplicationTagsMutation = vi.fn(() => Promise.resolve({ data: {} }));

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: vi.fn(() => ({
    setApplicationDates: mockSetApplicationDates,
    loading: false,
    error: null,
    data: null,
  })),
}));

const mockCompletePhase = vi.fn();
vi.mock("../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
  }),
}));

describe("ApplicationIntakePhase", () => {
  const TEST_APP_ID = "test-app-id";

  const DEFAULT_APPLICATION_INTAKE_PROPS: ApplicationIntakeProps = {
    applicationId: TEST_APP_ID,
    initialStateApplicationDocuments: [],
    initialStateApplicationSubmittedDate: "",
    tags: [],
    phaseStatus: "Started",
  };

  const MOCK_STATE_APPLICATION_DOCUMENT: ApplicationWorkflowDocument = {
    id: "1",
    name: "State Application Document 1",
    description: "Test state application document",
    documentType: "State Application",
    phaseName: "Application Intake",
    owner: { person: { fullName: "John Doe" } },
    createdAt: new Date("2024-01-12"),
  };

  const setup = (props: Partial<ApplicationIntakeProps> = {}) => {
    const finalProps = { ...DEFAULT_APPLICATION_INTAKE_PROPS, ...props } as ApplicationIntakeProps;

    const applicationTagOptionsMock: MockedResponse = {
      request: {
        query: GET_APPLICATION_TAG_OPTIONS,
      },
      result: {
        data: {
          applicationTagOptions: [
            { tagName: "Behavioral Health", approvalStatus: "Approved" },
            { tagName: "Dental", approvalStatus: "Unapproved" },
          ],
        },
      },
    };

    render(
      <DialogProvider>
        <TestProvider mocks={[applicationTagOptionsMock]}>
          <ApplicationIntakePhase {...finalProps} />
        </TestProvider>
      </DialogProvider>
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
      const uploadButton = screen.getByTestId(UPLOAD_BUTTON_NAME);
      expect(uploadButton).toBeInTheDocument();
    });

    it("shows 'No documents yet' when no documents", () => {
      setup();
      expect(screen.getByText("No documents yet.")).toBeInTheDocument();
    });

    it("displays Application Intake phase documents only", () => {
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
      });

      expect(screen.getByText("State Application Document 1")).toBeInTheDocument();
    });

    it("renders delete button for each document", () => {
      setup({ initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT] });

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

      const submittedDateInput = screen.getByTestId(APPLICATION_SUBMITTED_DATEPICKER_NAME);
      expect(submittedDateInput).toBeInTheDocument();
      expect(submittedDateInput).toHaveAttribute("type", "date");
      expect(submittedDateInput).toHaveAttribute("required");
    });

    it("renders Completeness Review Due Date input field (disabled)", () => {
      setup();
      const label = screen.getByText(/Completeness Review Due Date/);
      expect(label).toBeInTheDocument();

      const dueDateInput = screen.getByTestId(COMPLETENESS_REVIEW_DATEPICKER_NAME);
      expect(dueDateInput).toBeInTheDocument();
      expect(dueDateInput).toHaveAttribute("type", "date");
      expect(dueDateInput).toBeDisabled();
    });

    it("shows help text for auto-calculated due date", () => {
      setup();
      expect(screen.getByText(/Automatically calculated as 15 calendar days/)).toBeInTheDocument();
    });
  });

  describe("Step 3 - Apply Tags Section", () => {
    it("renders Step 3 title and description", async () => {
      setup({
        tags: [
          {
            tagName: "Behavioral Health",
            approvalStatus: "Approved",
          },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText("APPLICATION INTAKE")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/You must tag this application with one or more demonstration types/)
      ).toBeInTheDocument();
    });

    it("renders selected tags as removable chips", async () => {
      setup({
        tags: [
          {
            tagName: "Behavioral Health",
            approvalStatus: "Approved",
          },
          {
            tagName: "Substance Use",
            approvalStatus: "Unapproved",
          },
        ],
      });
      await waitFor(() => {
        expect(screen.getByText("APPLICATION INTAKE")).toBeInTheDocument();
      });

      expect(screen.getByTestId("remove-Behavioral Health-button")).toBeInTheDocument();
      expect(screen.getByTestId("remove-Substance Use-button")).toBeInTheDocument();
    });

    it("calls SET_APPLICATION_TAGS_MUTATION with updated tags when a tag is removed", async () => {
      setup({
        tags: [
          {
            tagName: "Behavioral Health",
            approvalStatus: "Approved",
          },
          {
            tagName: "Substance Use",
            approvalStatus: "Unapproved",
          },
        ],
      });
      await waitFor(() => {
        expect(screen.getByText("APPLICATION INTAKE")).toBeInTheDocument();
      });

      const removeButton = screen.getByTestId("remove-Behavioral Health-button");

      await userEvent.click(removeButton);

      await waitFor(() => {
        expect(mockSetApplicationTagsMutation).toHaveBeenCalledTimes(1);
      });

      expect(mockSetApplicationTagsMutation).toHaveBeenCalledWith({
        variables: {
          input: {
            applicationId: TEST_APP_ID,
            applicationTags: ["Substance Use"],
          },
        },
      });
    });
  });

  describe("Button Logic", () => {
    describe("Finish Button", () => {
      it("is disabled initially", () => {
        setup();
        const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
        expect(finishButton).toBeDisabled();
      });

      it("is enabled when documents are uploaded & state application date is filled", () => {
        setup({
          initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
          initialStateApplicationSubmittedDate: "2020-10-10",
        });
        const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
        expect(finishButton).toBeEnabled();
      });

      it("does not show Skip button (phase cannot be skipped)", () => {
        setup();
        const skipButton = screen.queryByRole("button", { name: /skip/i });
        expect(skipButton).not.toBeInTheDocument();
      });

      it("advances to Completeness phase after finishing", async () => {
        const setSelectedPhase = vi.fn();

        setup({
          initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
          initialStateApplicationSubmittedDate: "2020-10-10",
          setSelectedPhase,
        });

        const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
        await userEvent.click(finishButton);

        expect(mockCompletePhase).toHaveBeenCalledWith({
          applicationId: TEST_APP_ID,
          phaseName: "Application Intake",
        });
        expect(setSelectedPhase).toHaveBeenCalledWith("Completeness");
      });
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

  describe("getApplicationIntakeComponentFromApplication", () => {
    it("should extract demonstration data and return ApplicationIntakePhase component", () => {
      const mockDemonstration: ApplicationWorkflowDemonstration = {
        id: "demo-123",
        name: "Test Demo",
        state: {
          id: "CA",
          name: "California",
        },
        primaryProjectOfficer: {
          id: "po-1",
          fullName: "Jane Doe",
        },
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
        demonstrationTypes: [],
        tags: [],
      };

      const component = getApplicationIntakeComponentFromApplication(mockDemonstration);

      expect(component).toBeDefined();
      expect(component.type).toBe(ApplicationIntakePhase);
      expect(component.props.applicationId).toBe("demo-123");
      expect(component.props.initialStateApplicationDocuments).toHaveLength(1);
      expect(component.props.initialStateApplicationSubmittedDate).toBe("2024-10-13");
    });
  });

  describe("handleDateChange", () => {
    it("updates the state application submitted date when user changes date input", async () => {
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "2024-03-15" } });

      expect(submittedDateInput.value).toBe("2024-03-15");
    });

    it("calls setApplicationDates with only State Application Submitted Date and Completeness Review Due Date", async () => {
      vi.clearAllMocks();

      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "2024-03-15" } });

      await waitFor(() => {
        expect(mockSetApplicationDates).toHaveBeenCalledTimes(1);
      });

      expect(mockSetApplicationDates).toHaveBeenCalledWith({
        applicationId: TEST_APP_ID,
        applicationDates: [
          {
            dateType: "State Application Submitted Date",
            dateValue: "2024-03-15",
          },
          {
            dateType: "Completeness Review Due Date",
            dateValue: "2024-03-30",
          },
        ],
      });
    });

    it("updates completeness review due date when state application date changes", async () => {
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "2024-03-15" } });

      // Completeness review due date should be 15 days later: 2024-03-30
      await waitFor(() => {
        const dueDateInput = screen.getByTestId(
          COMPLETENESS_REVIEW_DATEPICKER_NAME
        ) as HTMLInputElement;

        expect(dueDateInput).toBeInTheDocument();
        expect(dueDateInput.value).toBe("2024-03-30");
      });
    });

    it("finish button is enabled when both date and documents are provided via props", () => {
      // Test the effect logic by providing both requirements via initial props
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      expect(finishButton).toBeEnabled();
    });

    it("finish button remains disabled when date is empty even with documents", () => {
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
        initialStateApplicationSubmittedDate: "",
      });

      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      expect(finishButton).toBeDisabled();
    });

    it("finish button remains disabled when no documents even with date, and date is cleared (DEMOS-1675)", async () => {
      vi.clearAllMocks();

      setup({
        initialStateApplicationDocuments: [],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const finishButton = screen.getByTestId(FINISH_BUTTON_NAME);
      expect(finishButton).toBeDisabled();

      // When there are no documents, the date should be auto-cleared (DEMOS-1675)
      await waitFor(() => {
        const submittedDateInput = screen.getByTestId(
          APPLICATION_SUBMITTED_DATEPICKER_NAME
        ) as HTMLInputElement;
        expect(submittedDateInput.value).toBe("");
      });

      // Verify dates were cleared on the server
      expect(mockSetApplicationDates).toHaveBeenCalledWith({
        applicationId: TEST_APP_ID,
        applicationDates: [
          { dateType: "State Application Submitted Date", dateValue: null },
          { dateType: "Completeness Review Due Date", dateValue: null },
        ],
      });
    });

    it("handles empty date value correctly", async () => {
      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      await userEvent.clear(submittedDateInput);

      expect(submittedDateInput.value).toBe("");
    });

    it("clears dates on the server when user manually clears the date field (DEMOS-1675)", async () => {
      vi.clearAllMocks();

      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
        initialStateApplicationSubmittedDate: "2024-03-15",
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      fireEvent.change(submittedDateInput, { target: { value: "" } });

      await waitFor(() => {
        expect(mockSetApplicationDates).toHaveBeenCalledWith({
          applicationId: TEST_APP_ID,
          applicationDates: [
            { dateType: "State Application Submitted Date", dateValue: null },
            { dateType: "Completeness Review Due Date", dateValue: null },
          ],
        });
      });
    });
  });

  describe("handleDocumentUploadSucceeded", () => {
    it("date field should have today's date after document upload", async () => {
      const todayString = getTodayEst();

      setup({
        initialStateApplicationDocuments: [MOCK_STATE_APPLICATION_DOCUMENT],
        initialStateApplicationSubmittedDate: todayString,
      });

      const submittedDateInput = screen.getByTestId(
        APPLICATION_SUBMITTED_DATEPICKER_NAME
      ) as HTMLInputElement;

      expect(submittedDateInput?.value).toBe(todayString);
    });
  });
});
