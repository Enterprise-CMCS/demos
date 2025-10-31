import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  SdgPreparationPhase,
  SET_SDG_PREPARATION_PHASE_DATE_MUTATION,
} from "./SdgPreparationPhase";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "components/toast";

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: string;
  name: string;
}

// --- Mocks ---

vi.mock("components/button", () => ({
  Button: (props: ButtonProps) => {
    const { children, onClick, disabled, name } = props;
    return (
      <button name={name} onClick={onClick} disabled={disabled} data-testid={name}>
        {children}
      </button>
    );
  },
  SecondaryButton: (props: ButtonProps) => {
    const { children, onClick, name } = props;
    return (
      <button name={name} onClick={onClick} data-testid={name}>
        {children}
      </button>
    );
  },
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
          dateValue: "2025-01-01T05:00:00.000Z",
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
        dateValue: "2025-01-01T00:00:00.000-05:00",
      },
    },
  },
  result: {
    data: {
      setApplicationDate: {
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
                dateValue: "2025-01-02T05:00:00.000Z",
              },
            ],
          },
        ],
      },
    },
  },
};

// --- Tests ---

describe("SdgPreparationPhase", () => {
  const mockSetSelectedPhase = vi.fn();

  const setup = (): void => {
    render(
      <ToastProvider>
        <MockedProvider mocks={[mockSetApplicationDate]} addTypename={false}>
          <SdgPreparationPhase
            demonstrationId={mockDemonstration.id}
            sdgPreparationPhase={mockDemonstration.phases[0]}
            setSelectedPhase={mockSetSelectedPhase}
          />
        </MockedProvider>
      </ToastProvider>
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

    it("calls correct handlers when buttons clicked", async () => {
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
        expect(screen.getByText(/Successfully saved SDG Workplan for later./i)).toBeInTheDocument();
      });
    });
  });
});
