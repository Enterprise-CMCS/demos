import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SdgPreparationPhase,
  hasChanges,
  getSdgPreparationPhaseFromApplication,
} from "./SdgPreparationPhase";
import { WorkflowApplication } from "components/application";
import type { ApplicationStatus, DateType, PhaseName, PhaseStatus } from "demos-server";
import { parseISO } from "date-fns";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";
import type { CurrentUser } from "components/user/UserContext";
import { ToastContainer } from "components/toast";
import { FAILED_TO_SAVE_MESSAGE, getPhaseCompletedMessage } from "util/messages";

const mockSetApplicationDate = vi.fn();
const mockCompletePhase = vi.fn();

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDate: () => ({
    setApplicationDate: mockSetApplicationDate,
    data: null,
    loading: false,
    error: null,
  }),
}));

vi.mock("components/application/phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
    data: null,
    loading: false,
    error: null,
  }),
}));

const mockApplication: Pick<WorkflowApplication, "id" | "phases"> = {
  id: "1",
  phases: [
    {
      phaseName: "SDG Preparation",
      phaseStatus: "Not Started",
      phaseDates: [
        {
          dateType: "Internal Expected Approval Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
        {
          dateType: "State Requested Approval Date",
          dateValue: parseISO("2025-03-15T04:00:00.000Z"),
        },
      ],
      phaseNotes: [],
    },
  ],
};

const mockCompleteApplication: Pick<WorkflowApplication, "id" | "phases"> = {
  ...mockApplication,
  phases: [
    {
      ...mockApplication.phases[0],
      phaseDates: [
        {
          dateType: "Internal Expected Approval Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
        { dateType: "SME Initial Review Date", dateValue: parseISO("2025-01-01T05:00:00.000Z") },
        {
          dateType: "FRT Initial Meeting Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
      ],
    },
  ],
};

const mockSetSelectedPhase = vi.fn();

const baseWorkflowApplication: WorkflowApplication = {
  id: "demo-1",
  currentPhaseName: "SDG Preparation",
  status: "Under Review",
  clearanceLevel: "CMS (OSORA)",
  documents: [],
  tags: [],
  phases: [],
};

const renderWithTestProvider = (ui: React.ReactNode, currentUser: CurrentUser = cmsMockUser) =>
  render(
    <TestProvider currentUser={currentUser}>
      {ui}
      <ToastContainer />
    </TestProvider>
  );

describe("SdgPreparationPhase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (
    application = mockApplication,
    applicationStatus: ApplicationStatus = "Pre-Submission",
    currentUser: CurrentUser = cmsMockUser
  ): void => {
    renderWithTestProvider(
      <SdgPreparationPhase
        applicationId={application.id}
        sdgPreparationPhase={application.phases[0]}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        applicationStatus={applicationStatus}
      />,
      currentUser
    );
  };

  describe("Header and Description", () => {
    it("renders the main section header and description", () => {
      setup();

      expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
      expect(
        screen.getByText("Plan and conduct internal and preparation tasks")
      ).toBeInTheDocument();
    });
  });

  describe("SDG Workplan Section", () => {
    it("renders title and helper text", () => {
      setup();

      expect(screen.getByText("SDG WORKPLAN")).toBeInTheDocument();
      expect(
        screen.getByText(
          /Ensure the expected approval date is reasonable based on required reviews and the complexity of the application\. This date may be revised at a later time, if necessary\./i
        )
      ).toBeInTheDocument();
    });

    it("renders Internal Expected Approval Date DatePicker", () => {
      setup();

      const datePicker = screen.getByTestId("datepicker-internal-expected-approval-date");
      expect(datePicker).toBeInTheDocument();

      expect(screen.getByText("Internal Expected Approval Date")).toBeInTheDocument();
      expect(screen.getByLabelText(/Internal Expected Approval Date/)).toBeInTheDocument();
    });

    it("renders State Requested Approval Date DatePicker below Internal Expected Approval Date", () => {
      setup();

      const internalDatePicker = screen.getByTestId("datepicker-internal-expected-approval-date");
      const stateDatePicker = screen.getByTestId("datepicker-state-requested-approval-date");

      expect(stateDatePicker).toHaveAccessibleName(/State Requested Approval Date/);
      expect(
        internalDatePicker.compareDocumentPosition(stateDatePicker) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("renders State Requested Approval Date as an optional field", () => {
      setup();

      expect(screen.getByTestId("datepicker-state-requested-approval-date")).not.toBeRequired();
      expect(screen.getByTestId("datepicker-internal-expected-approval-date")).toBeRequired();
    });
  });

  describe("Internal Reviews Section", () => {
    it("renders title and helper text", () => {
      setup();

      expect(screen.getByText("INTERNAL REVIEWS")).toBeInTheDocument();
      expect(
        screen.getByText("Record the Date that each key review meeting occurred below")
      ).toBeInTheDocument();
    });

    it("renders all three DatePickers", () => {
      setup();

      expect(screen.getByTestId("datepicker-sme-initial-review-date")).toHaveAccessibleName(
        /SME Initial Review Date/
      );
      expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toHaveAccessibleName(
        /FRT Initial Meeting Date/
      );
      expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toHaveAccessibleName(
        /BNPMT Initial Meeting Date/
      );
    });

    it("renders Save For Later and Finish buttons", () => {
      setup();

      const saveButton = screen.getByTestId("sdg-save-for-later");
      const finishButton = screen.getByTestId("sdg-finish");

      expect(saveButton).toBeInTheDocument();
      expect(finishButton).toBeInTheDocument();
      expect(finishButton).toBeDisabled();
    });

    it("hides actions and disables datepickers for readonly users", () => {
      setup(mockApplication, "Pre-Submission", readonlyMockUser);

      expect(screen.queryByTestId("sdg-save-for-later")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sdg-finish")).not.toBeInTheDocument();
      expect(screen.getByTestId("datepicker-internal-expected-approval-date")).toBeDisabled();
      expect(screen.getByTestId("datepicker-state-requested-approval-date")).toBeDisabled();
      expect(screen.getByTestId("datepicker-sme-initial-review-date")).toBeDisabled();
      expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toBeDisabled();
      expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toBeDisabled();
    });
  });

  describe("Date field handling", () => {
    it("prefills the Internal Expected Approval Date DatePicker with the correct date", () => {
      setup();

      const expectedDate = "2025-01-01";
      const dateInput = screen.getByTestId("datepicker-internal-expected-approval-date");

      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveValue(expectedDate);
    });

    it("prefills the State Requested Approval Date DatePicker with the correct date", () => {
      setup();

      expect(screen.getByTestId("datepicker-state-requested-approval-date")).toHaveValue(
        "2025-03-15"
      );
    });

    it("saves the State Requested Approval Date on Save For Later", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      setup();

      const stateRequestedApprovalDateInput = screen.getByTestId(
        "datepicker-state-requested-approval-date"
      );
      await userEvent.clear(stateRequestedApprovalDateInput);
      await userEvent.type(stateRequestedApprovalDateInput, "2025-04-20");

      await userEvent.click(screen.getByTestId("sdg-save-for-later"));

      await waitFor(() => {
        expect(mockSetApplicationDate).toHaveBeenCalledWith({
          applicationId: "1",
          dateType: "State Requested Approval Date",
          dateValue: "2025-04-20",
        });
      });
    });

    it("disables Save For Later button when there are no changes", () => {
      setup();

      const saveButton = screen.getByTestId("sdg-save-for-later");
      expect(saveButton).toBeDisabled();
    });

    it("enables Save For Later button when a date is changed", async () => {
      setup();

      const saveButton = screen.getByTestId("sdg-save-for-later");
      expect(saveButton).toBeDisabled();

      const internalExpectedApprovalDateInput = screen.getByTestId(
        "datepicker-internal-expected-approval-date"
      );
      await userEvent.clear(internalExpectedApprovalDateInput);
      await userEvent.type(internalExpectedApprovalDateInput, "2025-02-01");

      expect(saveButton).toBeEnabled();
    });

    it("shows success when Save For Later succeeds", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      setup();

      const internalExpectedApprovalDateInput = screen.getByTestId(
        "datepicker-internal-expected-approval-date"
      );
      expect(internalExpectedApprovalDateInput).toBeInTheDocument();

      await userEvent.clear(internalExpectedApprovalDateInput!);
      await userEvent.type(internalExpectedApprovalDateInput!, "2025-01-02");

      expect(internalExpectedApprovalDateInput).toHaveValue("2025-01-02");

      const saveButton = screen.getByTestId("sdg-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationDate).toHaveBeenCalledWith({
          applicationId: "1",
          dateType: "Internal Expected Approval Date",
          dateValue: "2025-01-02",
        });
        expect(screen.getByText(/Updates\s+saved successfully/)).toBeInTheDocument();
      });
    });

    it("shows error toast when Save For Later fails", async () => {
      mockSetApplicationDate.mockRejectedValue(new Error("Mutation failed"));
      setup();

      const internalExpectedApprovalDateInput = screen.getByTestId(
        "datepicker-internal-expected-approval-date"
      );
      await userEvent.clear(internalExpectedApprovalDateInput!);
      await userEvent.type(internalExpectedApprovalDateInput!, "2025-01-02");
      expect(internalExpectedApprovalDateInput).toHaveValue("2025-01-02");

      const saveButton = screen.getByTestId("sdg-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(FAILED_TO_SAVE_MESSAGE)).toBeInTheDocument();
      });
    });
  });

  describe("SdgPreparationPhase - Phase Status Mutation", () => {
    it("shows success toast when Finish succeess and calls setSelectedPhase", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockCompletePhase.mockResolvedValue({
        data: { completePhase: { __typename: "ApplicationPhase" } },
      });
      setup(mockCompleteApplication);

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(mockSetApplicationDate).toHaveBeenCalledTimes(4);
        expect(mockCompletePhase).toHaveBeenCalled();
        expect(screen.getByText(getPhaseCompletedMessage("SDG Preparation"))).toBeInTheDocument();
        expect(mockSetSelectedPhase).toHaveBeenCalledWith("Review");
      });
    });

    it("enables Finish and skips the mutation when State Requested Approval Date is empty", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockCompletePhase.mockResolvedValue({
        data: { completePhase: { __typename: "ApplicationPhase" } },
      });
      setup(mockCompleteApplication);

      expect(screen.getByTestId("datepicker-state-requested-approval-date")).toHaveValue("");

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(mockCompletePhase).toHaveBeenCalled();
      });
      expect(mockSetApplicationDate).not.toHaveBeenCalledWith(
        expect.objectContaining({ dateType: "State Requested Approval Date" })
      );
    });

    it("shows error toast when Finish fails", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockCompletePhase.mockRejectedValue(new Error("Mutation failed"));
      setup(mockCompleteApplication);

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText(FAILED_TO_SAVE_MESSAGE)).toBeInTheDocument();
      });
    });
  });
});

describe("hasChanges", () => {
  it("returns false when all fields are identical", () => {
    const initialData = {
      internalExpectedApprovalDate: "2025-01-01",
      stateRequestedApprovalDate: "2025-01-05",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    const currentData = {
      internalExpectedApprovalDate: "2025-01-01",
      stateRequestedApprovalDate: "2025-01-05",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    expect(hasChanges(initialData, currentData)).toBe(false);
  });

  it("returns true when any field changes", () => {
    const initialData = {
      internalExpectedApprovalDate: "2025-01-01",
      stateRequestedApprovalDate: "2025-01-05",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    const currentData = {
      internalExpectedApprovalDate: "2025-01-15",
      stateRequestedApprovalDate: "2025-01-05",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    expect(hasChanges(initialData, currentData)).toBe(true);
  });

  it("returns true when only the State Requested Approval Date changes", () => {
    const initialData = {
      internalExpectedApprovalDate: "2025-01-01",
      stateRequestedApprovalDate: undefined,
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    const currentData = { ...initialData, stateRequestedApprovalDate: "2025-01-05" };

    expect(hasChanges(initialData, currentData)).toBe(true);
  });

  it("returns true when a field changes from undefined to a value", () => {
    const initialData = {
      internalExpectedApprovalDate: undefined,
      stateRequestedApprovalDate: undefined,
      smeInitialReviewDate: undefined,
      frtInitialMeetingDate: undefined,
      bnpmtInitialMeetingDate: undefined,
    };

    const currentData = {
      internalExpectedApprovalDate: "2025-01-01",
      stateRequestedApprovalDate: undefined,
      smeInitialReviewDate: undefined,
      frtInitialMeetingDate: undefined,
      bnpmtInitialMeetingDate: undefined,
    };

    expect(hasChanges(initialData, currentData)).toBe(true);
  });
});

describe("Completed Phase Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const completedPhase = {
    phaseName: "SDG Preparation" as PhaseName,
    phaseStatus: "Completed" as PhaseStatus,
    phaseDates: [
      {
        dateType: "Internal Expected Approval Date" as DateType,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      {
        dateType: "SME Initial Review Date" as DateType,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      {
        dateType: "FRT Initial Meeting Date" as DateType,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      {
        dateType: "BNPMT Initial Meeting Date" as DateType,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      {
        dateType: "State Requested Approval Date" as DateType,
        dateValue: parseISO("2025-03-15T04:00:00.000Z"),
      },
    ],
    phaseNotes: [],
  };

  const renderCompleted = () =>
    renderWithTestProvider(
      <SdgPreparationPhase
        applicationId={mockCompleteApplication.id}
        sdgPreparationPhase={completedPhase}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        applicationStatus="Pre-Submission"
      />
    );

  it("disables Finish button when phase status is Completed", () => {
    renderCompleted();
    expect(screen.getByTestId("sdg-finish")).toBeDisabled();
  });

  it("keeps Internal Expected Approval Date editable when phase is Completed", () => {
    renderCompleted();
    expect(screen.getByTestId("datepicker-internal-expected-approval-date")).not.toBeDisabled();
  });

  it("disables SME, FRT, BNPMT, and State Requested date pickers when phase is Completed", () => {
    renderCompleted();
    expect(screen.getByTestId("datepicker-state-requested-approval-date")).toBeDisabled();
    expect(screen.getByTestId("datepicker-sme-initial-review-date")).toBeDisabled();
    expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toBeDisabled();
    expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toBeDisabled();
  });

  it("keeps the State Requested Approval Date populated while disabled", () => {
    renderCompleted();
    expect(screen.getByTestId("datepicker-state-requested-approval-date")).toHaveValue(
      "2025-03-15"
    );
  });

  it("enables Save For Later when Internal Expected Approval Date is changed after phase Completed", async () => {
    renderCompleted();

    const saveButton = screen.getByTestId("sdg-save-for-later");
    expect(saveButton).toBeDisabled();

    const dateInput = screen.getByTestId("datepicker-internal-expected-approval-date");
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2025-06-01");

    expect(saveButton).toBeEnabled();
  });

  it("only saves Internal Expected Approval Date when phase is Completed", async () => {
    mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
    renderCompleted();

    const dateInput = screen.getByTestId("datepicker-internal-expected-approval-date");
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2025-06-01");

    await userEvent.click(screen.getByTestId("sdg-save-for-later"));

    await waitFor(() => {
      expect(mockSetApplicationDate).toHaveBeenCalledTimes(1);
      expect(mockSetApplicationDate).toHaveBeenCalledWith({
        applicationId: "1",
        dateType: "Internal Expected Approval Date",
        dateValue: "2025-06-01",
      });
      expect(screen.getByText(/Updates\s+saved successfully/)).toBeInTheDocument();
    });
  });
});

describe("Approved Application Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApproved = () =>
    renderWithTestProvider(
      <SdgPreparationPhase
        applicationId="1"
        sdgPreparationPhase={{
          ...mockCompleteApplication.phases[0],
          phaseStatus: "Completed",
        }}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        applicationStatus="Approved"
      />
    );

  it("disables Internal Expected Approval Date when application is Approved", () => {
    renderApproved();
    expect(screen.getByTestId("datepicker-internal-expected-approval-date")).toBeDisabled();
  });

  it("keeps Save For Later disabled when application is Approved (no editable fields)", () => {
    renderApproved();
    expect(screen.getByTestId("sdg-save-for-later")).toBeDisabled();
  });
});

describe("getSdgPreparationPhaseFromApplication", () => {
  const mockSetSelectedPhase = vi.fn();

  it("renders the SDG Preparation Phase component when phase is found", () => {
    const application: WorkflowApplication = {
      ...baseWorkflowApplication,
      documents: [],
      phases: [
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Internal Expected Approval Date",
              dateValue: parseISO("2025-01-01T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
    };

    renderWithTestProvider(
      getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase)
    );

    expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
    expect(screen.getByTestId("sdg-finish")).toBeInTheDocument();
  });

  it("renders error message when SDG Preparation phase is not found", () => {
    const application: WorkflowApplication = {
      ...baseWorkflowApplication,
      currentPhaseName: "Concept",
      documents: [],
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
    };

    renderWithTestProvider(
      getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase)
    );

    expect(screen.getByText("Error: SDG Preparation Phase not found.")).toBeInTheDocument();
  });

  it("disables Finish button when previous phases are not completed", () => {
    const application: WorkflowApplication = {
      ...baseWorkflowApplication,
      documents: [],
      phases: [
        { phaseName: "Completeness", phaseStatus: "Started", phaseDates: [], phaseNotes: [] },
        { ...mockCompleteApplication.phases[0], phaseStatus: "Started" },
      ],
    };

    renderWithTestProvider(
      getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase)
    );

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeDisabled();
  });

  it("enables Finish button when all previous phases are completed or skipped", () => {
    const application: WorkflowApplication = {
      ...baseWorkflowApplication,
      documents: [],
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        { phaseName: "Completeness", phaseStatus: "Completed", phaseDates: [], phaseNotes: [] },
        { phaseName: "Federal Comment", phaseStatus: "Skipped", phaseDates: [], phaseNotes: [] },
        { ...mockCompleteApplication.phases[0], phaseStatus: "Started" },
      ],
    };

    renderWithTestProvider(
      getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase)
    );

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeEnabled();
  });
});
