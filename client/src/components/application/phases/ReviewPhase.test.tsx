import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseISO, format } from "date-fns";

import { ReviewPhase, getReviewPhaseComponentFromDemonstration } from "./ReviewPhase";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { ApplicationDate } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";

// Mock formatDateForServer so date output is predictable and uses date-fns (no toISOString slicing)
vi.mock("util/formatDate", () => ({
  formatDateForServer: (date: Date | string) => {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "yyyy-MM-dd");
  },
}));

const buildPhase = (dates: Record<string, string>): SimplePhase => ({
  phaseName: "Review",
  phaseStatus: "Not Started",
  phaseDates: Object.entries(dates).map(([dateType, iso]) => ({
    dateType: dateType as Pick<ApplicationDate, "dateType">["dateType"],
    dateValue: parseISO(iso),
  })),
});

const mockDemonstration: ApplicationWorkflowDemonstration = {
  id: "demo1",
  status: "Pre-Submission",
  currentPhaseName: "Review",
  documents: [],
  phases: [
    buildPhase({
      "OGD Approval to Share with SMEs": "2025-01-01T00:00:00.000Z",
      "Draft Approval Package to Prep": "2025-01-02T00:00:00.000Z",
      "DDME Approval Received": "2025-01-03T00:00:00.000Z",
      "State Concurrence": "2025-01-04T00:00:00.000Z",
      "BN PMT Approval to Send to OMB": "2025-01-05T00:00:00.000Z",
      "Draft Approval Package Shared": "2025-01-06T00:00:00.000Z",
      "Receive OMB Concurrence": "2025-01-07T00:00:00.000Z",
      "Receive OGC Legal Clearance": "2025-01-08T00:00:00.000Z",
      "PO OGD Notes": "2025-01-09T00:00:00.000Z",
      "OGC OMB Notes": "2025-01-10T00:00:00.000Z",
    }),
  ],
};

describe("ReviewPhase Component", () => {
  const setup = (
    formData = {
      ogcApprovalToShareDate: "2025-01-01",
      draftApprovalPackageToPrepDate: "2025-01-02",
      ddmeApprovalReceivedDate: "2025-01-03",
      stateConcurrenceDate: "2025-01-04",
      bnPmtApprovalReceivedDate: "2025-01-05",
      draftApprovalPackageSharedDate: "2025-01-06",
      receiveOMBConcurrenceDate: "2025-01-07",
      receiveOGCLegalClearanceDate: "2025-01-08",
      poOGDNotes: "notes1",
      ogcOMBNotes: "notes2",
    },
    demonstrationId = "test-demo-id"
  ) => {
    render(
      <TestProvider>
        <ReviewPhase formData={formData} demonstrationId={demonstrationId} />
      </TestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Header and description", () => {
    it("renders the Review header and description", () => {
      setup();

      expect(screen.getByText("REVIEW")).toBeInTheDocument();
      expect(
        screen.getByText(/Gather input and address comments from the HHS/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form fields", () => {
    it("renders all required date fields", () => {
      setup();

      const inputTestIds = [
        "datepicker-ogc-approval-to-share-date",
        "datepicker-draft-approval-package-to-prep-date",
        "datepicker-ddme-approval-received-date",
        "datepicker-state-concurrence-date",
        "datepicker-bn-pmt-approval-received-date",
        "datepicker-draft-approval-package-shared-date",
        "datepicker-receive-omb-concurrence-date",
        "datepicker-receive-ogc-legal-clearance-date",
      ];

      inputTestIds.forEach((testId) => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      });
    });

    it("renders PO OGD Notes and OGC OMB Notes fields", () => {
      setup();

      expect(screen.getByTestId("input-po-ogd-notes")).toBeInTheDocument();
      expect(screen.getByTestId("input-ogc-omb-notes")).toBeInTheDocument();
    });
  });

  describe("Prefill behavior", () => {
    it("prefills dates correctly", () => {
      setup();

      expect(screen.getByTestId("datepicker-ogc-approval-to-share-date")).toHaveValue("2025-01-01");
      expect(screen.getByTestId("datepicker-draft-approval-package-to-prep-date")).toHaveValue(
        "2025-01-02"
      );
      expect(screen.getByTestId("datepicker-ddme-approval-received-date")).toHaveValue(
        "2025-01-03"
      );
      expect(screen.getByTestId("datepicker-state-concurrence-date")).toHaveValue("2025-01-04");
    });
  });

  describe("Field updates", () => {
    it("updates a date field when user types", async () => {
      setup();

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");

      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, "2025-12-25");

      expect(dateInput).toHaveValue("2025-12-25");
    });

    it("updates a notes field when user types", async () => {
      setup();

      const notesInput = screen.getByTestId("input-po-ogd-notes");

      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, "Updated Note");

      expect(notesInput).toHaveValue("Updated Note");
    });
  });

  describe("Buttons", () => {
    it("renders Save For Later and Finish buttons", () => {
      setup();

      const saveButton = screen.getByTestId("review-save-for-later");
      const finishButton = screen.getByTestId("review-finish");

      expect(saveButton).toBeInTheDocument();
      expect(finishButton).toBeInTheDocument();
    });
  });
});

describe("getReviewPhaseComponentFromDemonstration", () => {
  it("renders ReviewPhase when Review phase exists", () => {
    const component = getReviewPhaseComponentFromDemonstration(mockDemonstration);
    render(<TestProvider>{component}</TestProvider>);

    expect(screen.getByText("REVIEW")).toBeInTheDocument();
  });

  it("renders error message when review phase is missing", () => {
    const demo: ApplicationWorkflowDemonstration = {
      ...mockDemonstration,
      phases: [],
    };

    const component = getReviewPhaseComponentFromDemonstration(demo);
    render(component);

    expect(screen.getByText(/Error: Review Phase not found/i)).toBeInTheDocument();
  });
});
