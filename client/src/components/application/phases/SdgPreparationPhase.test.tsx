import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SdgPreparationPhase } from "./SdgPreparationPhase";
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
const mockSetPhaseStatus = vi.fn();

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDate: () => ({
    setApplicationDate: mockSetApplicationDate,
    data: null,
    loading: false,
    error: null,
  }),
}));

vi.mock("../phase-status/phaseStatusQueries", () => ({
  useSetPhaseStatus: () => ({
    setPhaseStatus: mockSetPhaseStatus,
    data: null,
    loading: false,
    error: null,
  }),
}));

const mockSdgPreparationPhase: SdgPreparationPhase = {
  phaseDates: [
    {
      dateType: "Expected Approval Date",
      dateValue: parseISO("2025-01-01T05:00:00.000Z"),
    },
  ],
};

const mockCompleteSdgPreparationPhase: SdgPreparationPhase = {
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
};

describe("SdgPreparationPhase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (sdgPreparationPhase = mockSdgPreparationPhase): void => {
    render(<SdgPreparationPhase demonstrationId={"1"} sdgPreparationPhase={sdgPreparationPhase} />);
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
      expect(screen.getByLabelText("Expected Approval Date")).toBeInTheDocument();
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
      expect(screen.getByTestId("datepicker-frt-initial-meeting-date")).toBeInTheDocument();
      expect(screen.getByTestId("datepicker-bnpmt-initial-meeting-date")).toBeInTheDocument();
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
    it("shows success toast when Finish succeeds", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockSetPhaseStatus.mockResolvedValue({ data: { setPhaseStatus: { id: "1" } } });
      setup(mockCompleteSdgPreparationPhase);

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(mockSetApplicationDate).toHaveBeenCalledTimes(4);
        expect(mockSetPhaseStatus).toHaveBeenCalled();
        expect(showSuccess).toHaveBeenCalledWith(getPhaseCompletedMessage("SDG Preparation"));
      });
    });

    it("shows error toast when Finish fails", async () => {
      mockSetApplicationDate.mockResolvedValue({ data: { setApplicationDate: { id: "1" } } });
      mockSetPhaseStatus.mockRejectedValue(new Error("Mutation failed"));
      setup(mockCompleteSdgPreparationPhase);

      const finishButton = await screen.findByRole("button", { name: /finish/i });
      expect(finishButton).toBeEnabled();

      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(FAILED_TO_SAVE_MESSAGE);
      });
    });
  });
});
