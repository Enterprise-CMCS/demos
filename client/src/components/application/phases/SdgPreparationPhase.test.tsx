import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SdgPreparationPhase,
  hasChanges,
  getSdgPreparationPhaseFromDemonstration,
} from "./SdgPreparationPhase";
import { ApplicationWorkflowDemonstration } from "../demonstration/DemonstrationWorkflow";
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

const mockDemonstration: ApplicationWorkflowDemonstration = {
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

const mockCompleteDemonstration: ApplicationWorkflowDemonstration = {
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
    demonstration = mockDemonstration,
    demonstrationStatus:
      | "Pre-Submission"
      | "Under Review"
      | "Approved"
      | "Denied"
      | "Withdrawn" = "Pre-Submission"
  ): void => {
    render(
      <SdgPreparationPhase
        demonstrationId={demonstration.id}
        sdgPreparationPhase={demonstration.phases[0]}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        demonstrationStatus={demonstrationStatus}
      />
    );
  };

  describe("Header and Description", () => {
    it("renders the main section header and description", () => {
      setup();

      expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
      expect(screen.getByText("Plan and conduct internal preparation tasks")).toBeInTheDocument();
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
        screen.getByText("Record the occurrence of the key review meetings")
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
      setup(mockCompleteDemonstration);

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
      setup(mockCompleteDemonstration);

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
        demonstrationId={mockCompleteDemonstration.id}
        sdgPreparationPhase={completedPhase}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        demonstrationStatus="Pre-Submission"
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

describe("Approved Demonstration Behavior", () => {
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
        demonstrationId="1"
        sdgPreparationPhase={{
          phaseName: "SDG Preparation",
          phaseStatus: "Completed",
          phaseDates: allDates,
          phaseNotes: [],
        }}
        setSelectedPhase={mockSetSelectedPhase}
        allPreviousPhasesDone={true}
        demonstrationStatus="Approved"
      />
    );

  it("disables Expected Approval Date when demonstration is Approved", () => {
    renderApproved();
    expect(screen.getByTestId("datepicker-expected-approval-date")).toBeDisabled();
  });

  it("keeps Save For Later disabled when demonstration is Approved (no editable fields)", () => {
    renderApproved();
    expect(screen.getByTestId("sdg-save-for-later")).toBeDisabled();
  });
});

describe("getSdgPreparationPhaseFromDemonstration", () => {
  const mockSetSelectedPhase = vi.fn();

  it("renders the SDG Preparation Phase component when phase is found", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
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

    render(getSdgPreparationPhaseFromDemonstration(demonstration, mockSetSelectedPhase));

    expect(screen.getByText("SDG PREPARATION")).toBeInTheDocument();
    expect(screen.getByTestId("sdg-finish")).toBeInTheDocument();
  });

  it("renders error message when SDG Preparation phase is not found", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
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

    render(getSdgPreparationPhaseFromDemonstration(demonstration, mockSetSelectedPhase));

    expect(screen.getByText("Error: SDG Preparation Phase not found.")).toBeInTheDocument();
  });

  it("disables Finish button when previous phases are not completed", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
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

    render(getSdgPreparationPhaseFromDemonstration(demonstration, mockSetSelectedPhase));

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeDisabled();
  });

  it("enables Finish button when all previous phases are completed or skipped", () => {
    const demonstration: ApplicationWorkflowDemonstration = {
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

    render(getSdgPreparationPhaseFromDemonstration(demonstration, mockSetSelectedPhase));

    const finishButton = screen.getByTestId("sdg-finish");
    expect(finishButton).toBeEnabled();
  });
});
