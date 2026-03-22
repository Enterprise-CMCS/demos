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
import { ApplicationWorkflowDemonstration } from "../demonstration/DemonstrationWorkflow";
import { WorkflowApplication } from "components/application";
import type { ApplicationStatus } from "demos-server";
import { parseISO } from "date-fns";
import {
  FAILED_TO_SAVE_MESSAGE,
  getPhaseCompletedMessage,
  SAVE_FOR_LATER_MESSAGE,
} from "util/messages";

const showSuccess = vi.fn();
const showError = vi.fn();

vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess, showError }),
}));

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

vi.mock("../phase-status/phaseCompletionQueries", () => ({
  useCompletePhase: () => ({
    completePhase: mockCompletePhase,
    data: null,
    loading: false,
    error: null,
  }),
}));

const mockPO = {
  id: "po-1",
  fullName: "Jane Doe",
};

const mockApplication: ApplicationWorkflowDemonstration = {
  id: "1",
  name: "Test Demo",
  state: {
    id: "CA",
    name: "California",
  },
  primaryProjectOfficer: mockPO,
  status: "Pre-Submission",
  currentPhaseName: "SDG Preparation",
  documents: [],
  clearanceLevel: "CMS (OSORA)",
  phases: [
    {
      phaseName: "SDG Preparation",
      phaseStatus: "Not Started",
      phaseDates: [
        {
          dateType: "Expected Approval Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
      ],
      phaseNotes: [],
    },
  ],
  demonstrationTypes: [],
  tags: [],
};

const mockCompleteApplication: ApplicationWorkflowDemonstration = {
  id: "1",
  name: "Test Demo",
  state: {
    id: "CA",
    name: "California",
  },
  primaryProjectOfficer: mockPO,
  status: "Pre-Submission",
  currentPhaseName: "SDG Preparation",
  clearanceLevel: "CMS (OSORA)",
  documents: [],
  phases: [
    {
      phaseName: "SDG Preparation",
      phaseStatus: "Not Started",
      phaseDates: [
        {
          dateType: "Expected Approval Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
        { dateType: "SME Review Date", dateValue: parseISO("2025-01-01T05:00:00.000Z") },
        {
          dateType: "FRT Initial Meeting Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: parseISO("2025-01-01T05:00:00.000Z"),
        },
      ],
      phaseNotes: [],
    },
  ],
  demonstrationTypes: [],
  tags: [],
};

const mockSetSelectedPhase = vi.fn();

describe("SdgPreparationPhase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (
    application = mockApplication,
    applicationStatus: ApplicationStatus = "Pre-Submission"
  ): void => {
    render(
      <SdgPreparationPhase
        applicationId={application.id}
        sdgPreparationPhase={application.phases[0]}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        applicationStatus={applicationStatus}
      />
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

    it("renders Expected Approval Date DatePicker", () => {
      setup();

      const datePicker = screen.getByTestId("datepicker-expected-approval-date");
      expect(datePicker).toBeInTheDocument();

      expect(screen.getByText("Expected Approval Date")).toBeInTheDocument();
      expect(screen.getByLabelText(/Expected Approval Date/)).toBeInTheDocument();
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
        /SME Review Date/
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
  });

  describe("Date field handling", () => {
    it("prefills the Expected Approval Date DatePicker with the correct date", () => {
      setup();

      const expectedDate = "2025-01-01";
      const dateInput = screen.getByTestId("datepicker-expected-approval-date");

      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveValue(expectedDate);
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

      const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
      await userEvent.clear(expectedApprovalDateInput);
      await userEvent.type(expectedApprovalDateInput, "2025-02-01");

      expect(saveButton).toBeEnabled();
    });

    it("shows success when Save For Later succeeds", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      setup();

      const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
      expect(expectedApprovalDateInput).toBeInTheDocument();

      await userEvent.clear(expectedApprovalDateInput!);
      await userEvent.type(expectedApprovalDateInput!, "2025-01-02");

      expect(expectedApprovalDateInput).toHaveValue("2025-01-02");

      const saveButton = screen.getByTestId("sdg-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationDate).toHaveBeenCalledWith({
          applicationId: "1",
          dateType: "Expected Approval Date",
          dateValue: "2025-01-02",
        });
        expect(showSuccess).toHaveBeenCalledWith(SAVE_FOR_LATER_MESSAGE);
      });
    });

    it("shows error toast when Save For Later fails", async () => {
      mockSetApplicationDate.mockRejectedValue(new Error("Mutation failed"));
      setup();

      const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
      await userEvent.clear(expectedApprovalDateInput!);
      await userEvent.type(expectedApprovalDateInput!, "2025-01-02");
      expect(expectedApprovalDateInput).toHaveValue("2025-01-02");

      const saveButton = screen.getByTestId("sdg-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(FAILED_TO_SAVE_MESSAGE);
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
        expect(showSuccess).toHaveBeenCalledWith(getPhaseCompletedMessage("SDG Preparation"));
        expect(mockSetSelectedPhase).toHaveBeenCalledWith("Review");
      });
    });

    it("shows error toast when Finish fails", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockCompletePhase.mockRejectedValue(new Error("Mutation failed"));
      setup(mockCompleteApplication);

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(FAILED_TO_SAVE_MESSAGE);
      });
    });
  });
});

describe("hasChanges", () => {
  it("returns false when all fields are identical", () => {
    const initialData = {
      expectedApprovalDate: "2025-01-01",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    const currentData = {
      expectedApprovalDate: "2025-01-01",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    expect(hasChanges(initialData, currentData)).toBe(false);
  });

  it("returns true when any field changes", () => {
    const initialData = {
      expectedApprovalDate: "2025-01-01",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    const currentData = {
      expectedApprovalDate: "2025-01-15",
      smeInitialReviewDate: "2025-01-02",
      frtInitialMeetingDate: "2025-01-03",
      bnpmtInitialMeetingDate: "2025-01-04",
    };

    expect(hasChanges(initialData, currentData)).toBe(true);
  });

  it("returns true when a field changes from undefined to a value", () => {
    const initialData = {
      expectedApprovalDate: undefined,
      smeInitialReviewDate: undefined,
      frtInitialMeetingDate: undefined,
      bnpmtInitialMeetingDate: undefined,
    };

    const currentData = {
      expectedApprovalDate: "2025-01-01",
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
    phaseName: "SDG Preparation" as const,
    phaseStatus: "Completed" as const,
    phaseDates: [
      {
        dateType: "Expected Approval Date" as const,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      { dateType: "SME Review Date" as const, dateValue: parseISO("2025-01-01T05:00:00.000Z") },
      {
        dateType: "FRT Initial Meeting Date" as const,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
      {
        dateType: "BNPMT Initial Meeting Date" as const,
        dateValue: parseISO("2025-01-01T05:00:00.000Z"),
      },
    ],
    phaseNotes: [],
  };

  const renderCompleted = () =>
    render(
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

  it("keeps Expected Approval Date editable when phase is Completed", () => {
    renderCompleted();
    expect(screen.getByTestId("datepicker-expected-approval-date")).not.toBeDisabled();
  });

  it("disables SME, FRT, and BNPMT date pickers when phase is Completed", () => {
    renderCompleted();
    expect(screen.getByTestId("datepicker-sme-initial-review-date")).toBeDisabled();
    expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toBeDisabled();
    expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toBeDisabled();
  });

  it("enables Save For Later when Expected Approval Date is changed after phase Completed", async () => {
    renderCompleted();

    const saveButton = screen.getByTestId("sdg-save-for-later");
    expect(saveButton).toBeDisabled();

    const dateInput = screen.getByTestId("datepicker-expected-approval-date");
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2025-06-01");

    expect(saveButton).toBeEnabled();
  });

  it("only saves Expected Approval Date when phase is Completed", async () => {
    mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
    renderCompleted();

    const dateInput = screen.getByTestId("datepicker-expected-approval-date");
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, "2025-06-01");

    await userEvent.click(screen.getByTestId("sdg-save-for-later"));

    await waitFor(() => {
      expect(mockSetApplicationDate).toHaveBeenCalledTimes(1);
      expect(mockSetApplicationDate).toHaveBeenCalledWith({
        applicationId: "1",
        dateType: "Expected Approval Date",
        dateValue: "2025-06-01",
      });
      expect(showSuccess).toHaveBeenCalledWith(SAVE_FOR_LATER_MESSAGE);
    });
  });
});

describe("Approved Application Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const allDates = [
    {
      dateType: "Expected Approval Date" as const,
      dateValue: parseISO("2025-01-01T05:00:00.000Z"),
    },
    { dateType: "SME Review Date" as const, dateValue: parseISO("2025-01-01T05:00:00.000Z") },
    {
      dateType: "FRT Initial Meeting Date" as const,
      dateValue: parseISO("2025-01-01T05:00:00.000Z"),
    },
    {
      dateType: "BNPMT Initial Meeting Date" as const,
      dateValue: parseISO("2025-01-01T05:00:00.000Z"),
    },
  ];

  const renderApproved = () =>
    render(
      <SdgPreparationPhase
        applicationId="1"
        sdgPreparationPhase={{
          phaseName: "SDG Preparation",
          phaseStatus: "Completed",
          phaseDates: allDates,
          phaseNotes: [],
        }}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        applicationStatus="Approved"
      />
    );

  it("disables Expected Approval Date when application is Approved", () => {
    renderApproved();
    expect(screen.getByTestId("datepicker-expected-approval-date")).toBeDisabled();
  });

  it("keeps Save For Later disabled when application is Approved (no editable fields)", () => {
    renderApproved();
    expect(screen.getByTestId("sdg-save-for-later")).toBeDisabled();
  });
});

describe("getSdgPreparationPhaseFromApplication", () => {
  const mockSetSelectedPhase = vi.fn();

  it("renders the SDG Preparation Phase component when phase is found", () => {
    const application: ApplicationWorkflowDemonstration = {
      id: "demo-1",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "SDG Preparation",
      clearanceLevel: "CMS (OSORA)",
      documents: [],
      phases: [
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-01-01T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
    expect(screen.getByTestId("sdg-finish")).toBeInTheDocument();
  });

  it("renders error message when SDG Preparation phase is not found", () => {
    const application: ApplicationWorkflowDemonstration = {
      id: "demo-1",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "Concept",
      clearanceLevel: "CMS (OSORA)",
      documents: [],
      phases: [
        {
          phaseName: "Concept",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    expect(screen.getByText("Error: SDG Preparation Phase not found.")).toBeInTheDocument();
  });

  it("disables Finish button when previous phases are not completed", () => {
    const application: ApplicationWorkflowDemonstration = {
      id: "demo-1",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "SDG Preparation",
      clearanceLevel: "CMS (OSORA)",
      documents: [],
      phases: [
        {
          phaseName: "Completeness",
          phaseStatus: "Started", // Not completed
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-01-01T05:00:00.000Z"),
            },
            { dateType: "SME Review Date", dateValue: parseISO("2025-01-02T05:00:00.000Z") },
            {
              dateType: "FRT Initial Meeting Date",
              dateValue: parseISO("2025-01-03T05:00:00.000Z"),
            },
            {
              dateType: "BNPMT Initial Meeting Date",
              dateValue: parseISO("2025-01-04T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeDisabled();
  });

  it("enables Finish button when all previous phases are completed or skipped", () => {
    const application: ApplicationWorkflowDemonstration = {
      id: "demo-1",
      name: "Test Demo",
      state: {
        id: "CA",
        name: "California",
      },
      primaryProjectOfficer: mockPO,
      status: "Under Review",
      currentPhaseName: "SDG Preparation",
      clearanceLevel: "CMS (OSORA)",
      documents: [],
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Federal Comment",
          phaseStatus: "Skipped",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-01-01T05:00:00.000Z"),
            },
            { dateType: "SME Review Date", dateValue: parseISO("2025-01-02T05:00:00.000Z") },
            {
              dateType: "FRT Initial Meeting Date",
              dateValue: parseISO("2025-01-03T05:00:00.000Z"),
            },
            {
              dateType: "BNPMT Initial Meeting Date",
              dateValue: parseISO("2025-01-04T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
      demonstrationTypes: [],
      tags: [],
    };

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeEnabled();
  });
});

describe("Amendment and Extension SDG Preparation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const buildWorkflowApplication = (
    overrides: Partial<WorkflowApplication> = {}
  ): WorkflowApplication => ({
    id: "amendment-1",
    currentPhaseName: "SDG Preparation",
    status: "Under Review",
    clearanceLevel: "CMS (OSORA)",
    documents: [],
    tags: [],
    demonstrationTypes: [],
    phases: [
      {
        phaseName: "Application Intake",
        phaseStatus: "Completed",
        phaseDates: [],
        phaseNotes: [],
      },
      {
        phaseName: "Completeness",
        phaseStatus: "Completed",
        phaseDates: [],
        phaseNotes: [],
      },
      {
        phaseName: "Federal Comment",
        phaseStatus: "Completed",
        phaseDates: [],
        phaseNotes: [],
      },
      {
        phaseName: "SDG Preparation",
        phaseStatus: "Started",
        phaseDates: [],
        phaseNotes: [],
      },
    ],
    ...overrides,
  });

  it("renders SDG Preparation phase for an amendment workflow", () => {
    const amendment = buildWorkflowApplication({ id: "amendment-1" });

    render(getSdgPreparationPhaseFromApplication(amendment, mockSetSelectedPhase));

    expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
    expect(screen.getByText("Plan and conduct internal and preparation tasks")).toBeInTheDocument();
    expect(screen.getByText("SDG WORKPLAN")).toBeInTheDocument();
    expect(screen.getByText("INTERNAL REVIEWS")).toBeInTheDocument();
    expect(
      screen.getByText("Record the Date that each key review meeting occurred below")
    ).toBeInTheDocument();
  });

  it("renders SDG Preparation phase for an extension workflow", () => {
    const extension = buildWorkflowApplication({ id: "extension-1" });

    render(getSdgPreparationPhaseFromApplication(extension, mockSetSelectedPhase));

    expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-expected-approval-date")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-sme-initial-review-date")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toBeInTheDocument();
    expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toBeInTheDocument();
  });

  it("enables Finish button when all previous phases are completed and form is filled", () => {
    const application = buildWorkflowApplication({
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Federal Comment",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-06-01T05:00:00.000Z"),
            },
            { dateType: "SME Review Date", dateValue: parseISO("2025-05-01T05:00:00.000Z") },
            {
              dateType: "FRT Initial Meeting Date",
              dateValue: parseISO("2025-05-15T05:00:00.000Z"),
            },
            {
              dateType: "BNPMT Initial Meeting Date",
              dateValue: parseISO("2025-05-20T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
    });

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    expect(screen.getByTestId("sdg-finish")).toBeEnabled();
  });

  it("disables Finish button when previous phases are not completed", () => {
    const application = buildWorkflowApplication({
      phases: [
        {
          phaseName: "Completeness",
          phaseStatus: "Started",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-06-01T05:00:00.000Z"),
            },
            { dateType: "SME Review Date", dateValue: parseISO("2025-05-01T05:00:00.000Z") },
            {
              dateType: "FRT Initial Meeting Date",
              dateValue: parseISO("2025-05-15T05:00:00.000Z"),
            },
            {
              dateType: "BNPMT Initial Meeting Date",
              dateValue: parseISO("2025-05-20T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
    });

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    expect(screen.getByTestId("sdg-finish")).toBeDisabled();
  });

  it("calls completePhase and navigates to Review on Finish", async () => {
    mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
    mockCompletePhase.mockResolvedValue({
      data: { completePhase: { __typename: "ApplicationPhase" } },
    });

    const application = buildWorkflowApplication({
      phases: [
        {
          phaseName: "Application Intake",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Completeness",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "Federal Comment",
          phaseStatus: "Completed",
          phaseDates: [],
          phaseNotes: [],
        },
        {
          phaseName: "SDG Preparation",
          phaseStatus: "Started",
          phaseDates: [
            {
              dateType: "Expected Approval Date",
              dateValue: parseISO("2025-06-01T05:00:00.000Z"),
            },
            { dateType: "SME Review Date", dateValue: parseISO("2025-05-01T05:00:00.000Z") },
            {
              dateType: "FRT Initial Meeting Date",
              dateValue: parseISO("2025-05-15T05:00:00.000Z"),
            },
            {
              dateType: "BNPMT Initial Meeting Date",
              dateValue: parseISO("2025-05-20T05:00:00.000Z"),
            },
          ],
          phaseNotes: [],
        },
      ],
    });

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    const finishButton = screen.getByTestId("sdg-finish");
    await userEvent.click(finishButton);

    await waitFor(() => {
      expect(mockCompletePhase).toHaveBeenCalledWith({
        applicationId: application.id,
        phaseName: "SDG Preparation",
      });
      expect(mockSetSelectedPhase).toHaveBeenCalledWith("Review");
      expect(showSuccess).toHaveBeenCalledWith(getPhaseCompletedMessage("SDG Preparation"));
    });
  });

  it("saves dates via Save For Later for amendment/extension workflows", async () => {
    mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });

    const application = buildWorkflowApplication();

    render(getSdgPreparationPhaseFromApplication(application, mockSetSelectedPhase));

    const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
    await userEvent.type(expectedApprovalDateInput, "2025-07-01");

    const saveButton = screen.getByTestId("sdg-save-for-later");
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSetApplicationDate).toHaveBeenCalledWith({
        applicationId: "amendment-1",
        dateType: "Expected Approval Date",
        dateValue: "2025-07-01",
      });
      expect(showSuccess).toHaveBeenCalledWith(SAVE_FOR_LATER_MESSAGE);
    });
  });
});
