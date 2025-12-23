import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseISO, format } from "date-fns";

import { ReviewPhase } from "./ReviewPhase";
import { ReviewPhaseFormData } from "./ReviewPhase";
import { TestProvider } from "test-utils/TestProvider";

// Mock formatDateForServer so date output is predictable and uses date-fns (no toISOString slicing)
vi.mock("util/formatDate", () => ({
  formatDateForServer: (date: Date | string) => {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "yyyy-MM-dd");
  },
}));

// Mock the queries
const mockSetApplicationDates = vi.fn();
const mockSetApplicationNotes = vi.fn();
const mockSetPhaseStatus = vi.fn();

vi.mock("components/application/date/dateQueries", () => ({
  useSetApplicationDates: () => ({
    setApplicationDates: mockSetApplicationDates,
  }),
}));

vi.mock("components/application/note/noteQueries", () => ({
  useSetApplicationNotes: () => ({
    setApplicationNotes: mockSetApplicationNotes,
  }),
}));

vi.mock("../../phase-status/phaseStatusQueries", () => ({
  useSetPhaseStatus: () => ({
    setPhaseStatus: mockSetPhaseStatus,
  }),
}));

const buildInitialFormData = (overrides?: Partial<ReviewPhaseFormData>): ReviewPhaseFormData => ({
  dates: {
    "OGD Approval to Share with SMEs": "2025-01-01",
    "Draft Approval Package to Prep": "2025-01-02",
    "DDME Approval Received": "2025-01-03",
    "State Concurrence": "2025-01-04",
    "BN PMT Approval to Send to OMB": "2025-01-05",
    "Draft Approval Package Shared": "2025-01-06",
    "Receive OMB Concurrence": "2025-01-07",
    "Receive OGC Legal Clearance": "2025-01-08",
    "Package Sent to COMMs Clearance": "2025-01-09",
    "COMMs Clearance Received": "2025-01-10",
  },
  notes: {
    "PO and OGD": "PO OGD notes",
    "OGC and OMB": "OGC OMB notes",
    "COMMs Clearance": "COMMs notes",
  },
  clearanceLevel: "COMMs",
  ...overrides,
});

describe("ReviewPhase Component", () => {
  const setup = (initialFormData = buildInitialFormData(), demonstrationId = "test-demo-id") => {
    render(
      <TestProvider>
        <ReviewPhase initialFormData={initialFormData} demonstrationId={demonstrationId} />
      </TestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetApplicationDates.mockClear();
    mockSetApplicationNotes.mockClear();
    mockSetPhaseStatus.mockClear();
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

  describe("Sections", () => {
    it("renders three section headers", () => {
      setup();

      expect(screen.getByText("PO & OGD")).toBeInTheDocument();
      expect(screen.getByText("OGC & OMB")).toBeInTheDocument();
      expect(screen.getByText("Comms Clearance")).toBeInTheDocument();
    });

    it("shows CMS (OSORA) section when clearance level is CMS (OSORA)", () => {
      setup(buildInitialFormData({ clearanceLevel: "CMS (OSORA)" }));

      expect(screen.getByText("CMS (OSORA) Clearance")).toBeInTheDocument();
    });

    it("does not show CMS (OSORA) section when clearance level is COMMs", () => {
      setup(buildInitialFormData({ clearanceLevel: "COMMs" }));

      expect(screen.queryByText("CMS (OSORA) Clearance")).not.toBeInTheDocument();
    });
  });

  describe("Clearance Level Radio Buttons", () => {
    it("renders clearance level radio buttons", () => {
      setup();

      expect(screen.getByText("COMMs Clearance Required")).toBeInTheDocument();
      expect(screen.getByText("CMS (OSORA) Clearance Required")).toBeInTheDocument();
    });

    it("selects COMMs clearance level based on setup data", () => {
      setup();

      const commsRadio = screen.getByLabelText("COMMs Clearance Required");
      expect(commsRadio).toBeChecked();
    });

    it("switches to CMS (OSORA) section when CMS radio is selected", async () => {
      setup();

      const cmsRadio = screen.getByLabelText("CMS (OSORA) Clearance Required");
      await userEvent.click(cmsRadio);

      await waitFor(() => {
        expect(screen.getByText("CMS (OSORA) Clearance")).toBeInTheDocument();
        expect(screen.queryByText("Comms Clearance")).not.toBeInTheDocument();
      });
    });
  });

  describe("Section completion and expansion", () => {
    it("marks PO & OGD section as complete when all dates are filled", () => {
      setup();

      expect(screen.getAllByText("Complete")[0]).toBeInTheDocument();
    });

    it("marks PO & OGD section as incomplete when dates are missing", () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
        },
      });
      setup(incompleteData);
      const poOgdSection = screen.getByText("PO & OGD").closest("section");
      expect(poOgdSection).toHaveTextContent("Incomplete");
    });

    it("collapses completed sections automatically", () => {
      setup();

      // Complete sections should be collapsed, so notes fields should not be visible
      expect(screen.queryByTestId("input-po-ogd-notes")).not.toBeInTheDocument();
    });

    it("keeps incomplete sections expanded", () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
      });
      setup(incompleteData);

      // Incomplete section should be expanded, so notes field should be visible
      expect(screen.getByTestId("input-po-ogd-notes")).toBeInTheDocument();
    });

    it("requires COMMs clearance section completion when COMMs is selected", () => {
      const dataWithoutClearance = buildInitialFormData({
        clearanceLevel: "COMMs",
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-01",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
          "BN PMT Approval to Send to OMB": "2025-01-05",
          "Draft Approval Package Shared": "2025-01-06",
          "Receive OMB Concurrence": "2025-01-07",
          "Receive OGC Legal Clearance": "2025-01-08",
          "Package Sent to COMMs Clearance": "",
          "COMMs Clearance Received": "",
        },
      });
      setup(dataWithoutClearance);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeDisabled();
    });

    it("requires CMS (OSORA) clearance section completion when CMS (OSORA) is selected", () => {
      const dataWithoutOsora = buildInitialFormData({
        clearanceLevel: "CMS (OSORA)",
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-01",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
          "BN PMT Approval to Send to OMB": "2025-01-05",
          "Draft Approval Package Shared": "2025-01-06",
          "Receive OMB Concurrence": "2025-01-07",
          "Receive OGC Legal Clearance": "2025-01-08",
          "Submit Approval Package to OSORA": "",
          "OSORA R1 Comments Due": "",
          "OSORA R2 Comments Due": "",
          "CMS (OSORA) Clearance End": "",
        },
      });
      setup(dataWithoutOsora);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeDisabled();
    });

    it("enables finish button when CMS (OSORA) section is complete and CMS (OSORA) is selected", () => {
      const completeOsoraData = buildInitialFormData({
        clearanceLevel: "CMS (OSORA)",
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-01",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
          "BN PMT Approval to Send to OMB": "2025-01-05",
          "Draft Approval Package Shared": "2025-01-06",
          "Receive OMB Concurrence": "2025-01-07",
          "Receive OGC Legal Clearance": "2025-01-08",
          "Submit Approval Package to OSORA": "2025-01-09",
          "OSORA R1 Comments Due": "2025-01-10",
          "OSORA R2 Comments Due": "2025-01-11",
          "CMS (OSORA) Clearance End": "2025-01-12",
        },
      });
      setup(completeOsoraData);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeEnabled();
    });

    it("enables finish button when COMMs section is complete and COMMs is selected", () => {
      const completeCommsData = buildInitialFormData({
        clearanceLevel: "COMMs",
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-01",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
          "BN PMT Approval to Send to OMB": "2025-01-05",
          "Draft Approval Package Shared": "2025-01-06",
          "Receive OMB Concurrence": "2025-01-07",
          "Receive OGC Legal Clearance": "2025-01-08",
          "Package Sent to COMMs Clearance": "2025-01-09",
          "COMMs Clearance Received": "2025-01-10",
        },
      });
      setup(completeCommsData);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeEnabled();
    });
  });

  describe("Buttons", () => {
    it("renders Save For Later and Finish buttons", () => {
      setup();

      expect(screen.getByTestId("review-save-for-later")).toBeInTheDocument();
      expect(screen.getByTestId("review-finish")).toBeInTheDocument();
    });

    it("disables Save For Later button when no changes are made", () => {
      setup();

      const saveButton = screen.getByTestId("review-save-for-later");
      expect(saveButton).toBeDisabled();
    });

    it("enables Save For Later button when changes are made", async () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
      });
      setup(incompleteData);

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");
      await userEvent.type(dateInput, "2025-12-25");

      await waitFor(() => {
        const saveButton = screen.getByTestId("review-save-for-later");
        expect(saveButton).toBeEnabled();
      });
    });

    it("disables Finish button when required sections are incomplete", () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
      });
      setup(incompleteData);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeDisabled();
    });

    it("enables Finish button when all required sections are complete", () => {
      setup();

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeEnabled();
    });

    it("disables Finish button when clearance section is incomplete", () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "Package Sent to COMMs Clearance": "",
        },
      });
      setup(incompleteData);

      const finishButton = screen.getByTestId("review-finish");
      expect(finishButton).toBeDisabled();
    });
  });

  describe("Form data updates", () => {
    it("updates form data when a date is changed", async () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
      });
      setup(incompleteData);

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");
      await userEvent.type(dateInput, "2025-12-25");

      expect(dateInput).toHaveValue("2025-12-25");
    });

    it("updates form data when notes are changed", async () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
      });
      setup(incompleteData);

      const notesInput = screen.getByTestId("input-po-ogd-notes");
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, "Updated notes");

      expect(notesInput).toHaveValue("Updated notes");
    });
  });

  describe("Save For Later functionality", () => {
    it("calls setApplicationDates when saving date changes", async () => {
      const incompleteData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
          "Draft Approval Package to Prep": "2025-01-02",
          "DDME Approval Received": "2025-01-03",
          "State Concurrence": "2025-01-04",
          "BN PMT Approval to Send to OMB": "2025-01-05",
          "Draft Approval Package Shared": "2025-01-06",
          "Receive OMB Concurrence": "2025-01-07",
          "Receive OGC Legal Clearance": "2025-01-08",
          "Package Sent to COMMs Clearance": "2025-01-09",
          "COMMs Clearance Received": "2025-01-10",
        },
      });
      setup(incompleteData, "demo-123");

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");
      await userEvent.type(dateInput, "2025-12-25");

      const saveButton = screen.getByTestId("review-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationDates).toHaveBeenCalledWith({
          applicationId: "demo-123",
          applicationDates: expect.arrayContaining([
            {
              dateType: "OGD Approval to Share with SMEs",
              dateValue: "2025-12-25",
            },
            {
              dateType: "Draft Approval Package to Prep",
              dateValue: "2025-01-02",
            },
          ]),
        });
      });
    });

    it("calls setApplicationNotes when saving note changes", async () => {
      const initialData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
        notes: {
          "PO and OGD": "Original note",
        },
      });
      setup(initialData, "demo-456");

      const notesInput = screen.getByTestId("input-po-ogd-notes");
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, "Updated note content");

      const saveButton = screen.getByTestId("review-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationNotes).toHaveBeenCalledWith({
          applicationId: "demo-456",
          applicationNotes: expect.arrayContaining([
            {
              noteType: "PO and OGD",
              content: "Updated note content",
            },
          ]),
        });
      });
    });

    it("calls both setApplicationDates and setApplicationNotes when both are changed", async () => {
      const initialData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
        notes: {
          "PO and OGD": "Original note",
        },
      });
      setup(initialData, "demo-789");

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");
      await userEvent.type(dateInput, "2025-12-25");

      const notesInput = screen.getByTestId("input-po-ogd-notes");
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, "New note");

      const saveButton = screen.getByTestId("review-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationDates).toHaveBeenCalled();
        expect(mockSetApplicationNotes).toHaveBeenCalled();
      });
    });

    it("does not call setApplicationDates when no dates are filled", async () => {
      const initialData = buildInitialFormData({
        dates: {},
        notes: {
          "PO and OGD": "Original note",
        },
      });
      setup(initialData, "demo-no-dates");

      const notesInput = screen.getByTestId("input-po-ogd-notes");
      await userEvent.clear(notesInput);
      await userEvent.type(notesInput, "Updated note");

      const saveButton = screen.getByTestId("review-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationNotes).toHaveBeenCalled();
        expect(mockSetApplicationDates).not.toHaveBeenCalled();
      });
    });

    it("does not call setApplicationNotes when no notes are filled", async () => {
      const initialData = buildInitialFormData({
        dates: {
          "OGD Approval to Share with SMEs": "",
        },
        notes: {},
      });
      setup(initialData, "demo-no-notes");

      const dateInput = screen.getByTestId("datepicker-ogc-approval-to-share-date");
      await userEvent.type(dateInput, "2025-12-25");

      const saveButton = screen.getByTestId("review-save-for-later");
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetApplicationDates).toHaveBeenCalled();
        expect(mockSetApplicationNotes).not.toHaveBeenCalled();
      });
    });
  });
});
