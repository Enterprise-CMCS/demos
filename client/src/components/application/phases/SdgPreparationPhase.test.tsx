import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SdgPreparationPhase,
  SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
  SET_SDG_PREPARATION_PHASE_STATUS_MUTATION,
} from "./SdgPreparationPhase";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { MockedProvider } from "@apollo/client/testing";
import { parseISO } from "date-fns";

const showSuccess = vi.fn();
const showError = vi.fn();

vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess, showError }),
}));

const mockDemonstration: ApplicationWorkflowDemonstration = {
  id: "1",
  status: "Pre-Submission",
  currentPhaseName: "SDG Preparation",
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
      ],
    },
  ],
};

const mockSetApplicationDate = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "Expected Approval Date",
        dateValue: "2025-01-02",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
        id: "1",
      },
    },
  },
};

const mockSetApplicationDate1 = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "Expected Approval Date",
        dateValue: "2025-01-01",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
        id: "1",
      },
    },
  },
};

const mockSetApplicationDate2 = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "SME Review Date",
        dateValue: "2025-01-01",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
        id: "1",
      },
    },
  },
};

const mockSetApplicationDate3 = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "FRT Initial Meeting Date",
        dateValue: "2025-01-01",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
        id: "1",
      },
    },
  },
};

const mockSetApplicationDate4 = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "BNPMT Initial Meeting Date",
        dateValue: "2025-01-01",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
        id: "1",
      },
    },
  },
};

const mockSetApplicationDateError = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        dateType: "Expected Approval Date",
        dateValue: "2025-01-02T00:00:00.000-05:00",
      },
    },
  },
  error: new Error("Mutation failed"),
};

const mockCompleteDemonstration: ApplicationWorkflowDemonstration = {
  id: "1",
  status: "Pre-Submission",
  currentPhaseName: "SDG Preparation",
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
    },
  ],
};

const mockStatusMutationSuccess = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_STATUS_MUTATION,
    variables: {
      input: {
        applicationId: mockCompleteDemonstration.id,
        phaseName: "SDG Preparation",
        phaseStatus: "Completed",
      },
    },
  },
  result: {
    data: {
      setApplicationPhaseStatus: {
        id: mockCompleteDemonstration.id,
        phases: [{ phaseName: "SDG Preparation", phaseStatus: "Completed" }],
      },
    },
  },
};

const mockStatusMutationError = {
  request: {
    query: SET_SDG_PREPARATION_PHASE_STATUS_MUTATION,
    variables: {
      input: {
        applicationId: mockDemonstration.id,
        phaseName: "SDG Preparation",
        phaseStatus: "Completed",
      },
    },
  },
  error: new Error("Mutation failed"),
};

// --- Tests ---

describe("SdgPreparationPhase", () => {
  const mockSetSelectedPhase = vi.fn();

  const setup = (): void => {
    render(
      <MockedProvider mocks={[mockSetApplicationDate]} addTypename={false}>
        <SdgPreparationPhase
          demonstrationId={mockDemonstration.id}
          sdgPreparationPhase={mockDemonstration.phases[0]}
          setSelectedPhase={mockSetSelectedPhase}
        />
      </MockedProvider>
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
          /Ensure the expected approval date is reasonable based on required reviews/i
        )
      ).toBeInTheDocument();
    });

    it("renders Expected Approval Date DatePicker", () => {
      setup();

      const datePicker = screen.getByTestId("datepicker-expected-approval-date");
      expect(datePicker).toBeInTheDocument();

      expect(screen.getByText("Expected Approval Date")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Expected Approval Date")).toBeInTheDocument();
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

      expect(screen.getByTestId("datepicker-sme-initial-review-date")).toBeInTheDocument();
      expect(screen.getByTestId("datepicker-frt-intial-meeting-date")).toBeInTheDocument();
      expect(screen.getByTestId("datepicker-bnpmt-intial-meeting-date")).toBeInTheDocument();
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

    it("shows success when Save For Later succeeds", async () => {
      setup();

      const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
      expect(expectedApprovalDateInput).toBeInTheDocument();

      // Change the value to a new date
      await userEvent.clear(expectedApprovalDateInput!);
      await userEvent.type(expectedApprovalDateInput!, "2025-01-02");

      expect(expectedApprovalDateInput).toHaveValue("2025-01-02");

      const saveButton = screen.getByTestId("sdg-save-for-later");

      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Successfully saved SDG Workplan for later.");
      });
    });
  });

  it("shows error toast when Save For Later fails", async () => {
    render(
      <MockedProvider mocks={[mockSetApplicationDateError]} addTypename={false}>
        <SdgPreparationPhase
          demonstrationId={mockDemonstration.id}
          sdgPreparationPhase={mockDemonstration.phases[0]}
          setSelectedPhase={vi.fn()}
        />
      </MockedProvider>
    );

    const expectedApprovalDateInput = screen.getByTestId("datepicker-expected-approval-date");
    await userEvent.clear(expectedApprovalDateInput!);
    await userEvent.type(expectedApprovalDateInput!, "2025-01-02");
    expect(expectedApprovalDateInput).toHaveValue("2025-01-02");

    const saveButton = screen.getByTestId("sdg-save-for-later");
    await userEvent.click(saveButton);

    // Wait for the error toast to be called
    await screen.findByTestId("datepicker-expected-approval-date"); // Ensures update cycle
    expect(showError).toHaveBeenCalledWith("Failed to save SDG Workplan for later.");
  });

  describe("SdgPreparationPhase - Phase Status Mutation", () => {
    beforeEach(() => {
      showSuccess.mockClear();
      showError.mockClear();
      mockSetSelectedPhase.mockClear();
    });

    it("shows success toast and calls setSelectedPhase when Finish succeeds", async () => {
      render(
        <MockedProvider
          mocks={[
            mockStatusMutationSuccess,
            mockSetApplicationDate1,
            mockSetApplicationDate2,
            mockSetApplicationDate3,
            mockSetApplicationDate4,
          ]}
          addTypename={false}
        >
          <SdgPreparationPhase
            demonstrationId={mockCompleteDemonstration.id}
            sdgPreparationPhase={mockCompleteDemonstration.phases[0]}
            setSelectedPhase={mockSetSelectedPhase}
          />
        </MockedProvider>
      );

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(showSuccess).toHaveBeenCalledWith("Successfully finished SDG Preparation phase.");
        expect(mockSetSelectedPhase).toHaveBeenCalledWith("Approval Package");
      });
    });

    it("shows error toast when Finish fails", async () => {
      render(
        <MockedProvider
          mocks={[
            mockStatusMutationError,
            mockSetApplicationDate1,
            mockSetApplicationDate2,
            mockSetApplicationDate3,
            mockSetApplicationDate4,
          ]}
          addTypename={false}
        >
          <SdgPreparationPhase
            demonstrationId={mockCompleteDemonstration.id}
            sdgPreparationPhase={mockCompleteDemonstration.phases[0]}
            setSelectedPhase={mockSetSelectedPhase}
          />
        </MockedProvider>
      );

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith("Failed to finish SDG Preparation phase.");
        expect(mockSetSelectedPhase).not.toHaveBeenCalled();
      });
    });
  });
});
