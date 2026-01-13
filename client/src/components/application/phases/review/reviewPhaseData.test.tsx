import { describe, it, expect } from "vitest";
import {
  getReviewPhaseComponentFromDemonstration,
  formatDataForSave,
  hasFormChanges,
  ReviewPhaseDemonstration,
  getPhaseData,
} from "./reviewPhaseData";
import { ReviewPhaseFormData } from "./ReviewPhase";
import { SimplePhase } from "components/application/ApplicationWorkflow";

describe("reviewPhaseData", () => {
  const mockOnFinish = vi.fn();

  describe("getFormDataFromPhase", () => {
    it("should return empty dates and notes when phase has no data", () => {
      const reviewPhase: SimplePhase = {
        phaseName: "Review",
        phaseDates: [],
        phaseNotes: [],
        phaseStatus: "Started",
      };

      const result = getPhaseData(reviewPhase);

      expect(result.dates).toEqual({});
      expect(result.notes).toEqual({});
    });

    it("should convert phase dates to form data format", () => {
      const reviewPhase: SimplePhase = {
        phaseName: "Review",
        phaseDates: [
          { dateType: "OGD Approval to Share with SMEs", dateValue: new Date("2025-01-15") },
          { dateType: "Draft Approval Package to Prep", dateValue: new Date("2025-02-20") },
          { dateType: "DDME Approval Received", dateValue: new Date("2025-03-10") },
        ],
        phaseNotes: [],
        phaseStatus: "Started",
      };

      const result = getPhaseData(reviewPhase);

      expect(result.dates["OGD Approval to Share with SMEs"]).toBe("2025-01-15");
      expect(result.dates["Draft Approval Package to Prep"]).toBe("2025-02-20");
      expect(result.dates["DDME Approval Received"]).toBe("2025-03-10");
    });

    it("should convert phase notes to form data format", () => {
      const reviewPhase: SimplePhase = {
        phaseName: "Review",
        phaseDates: [],
        phaseNotes: [
          { noteType: "PO and OGD", content: "PO notes here" },
          { noteType: "OGC and OMB", content: "OGC notes here" },
          { noteType: "COMMs Clearance", content: "COMMs notes here" },
        ],
        phaseStatus: "Started",
      };

      const result = getPhaseData(reviewPhase);

      expect(result.notes["PO and OGD"]).toBe("PO notes here");
      expect(result.notes["OGC and OMB"]).toBe("OGC notes here");
      expect(result.notes["COMMs Clearance"]).toBe("COMMs notes here");
    });
  });

  describe("getReviewPhaseComponentFromDemonstration", () => {
    it("should return error div when review phase is not found", () => {
      const demonstration: ReviewPhaseDemonstration = {
        id: "demo-123",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Concept",
            phaseDates: [],
            phaseNotes: [],
            phaseStatus: "Started",
          },
        ],
      };

      const result = getReviewPhaseComponentFromDemonstration(demonstration, mockOnFinish);

      expect(result.type).toBe("div");
      expect(result.props.children).toBe("Error: Review Phase not found.");
    });

    it("should return ReviewPhase component when review phase exists", () => {
      const demonstration: ReviewPhaseDemonstration = {
        id: "demo-456",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Review",
            phaseDates: [
              { dateType: "OGD Approval to Share with SMEs", dateValue: new Date("2025-01-10") },
            ],
            phaseNotes: [{ noteType: "PO and OGD", content: "Test note" }],
            phaseStatus: "Started",
          },
        ],
      };

      const result = getReviewPhaseComponentFromDemonstration(demonstration, mockOnFinish);

      expect(result.type.name).toBe("ReviewPhase");
      expect(result.props.demonstrationId).toBe("demo-456");
      expect(result.props.initialFormData).toBeDefined();
      expect(result.props.initialFormData.dates["OGD Approval to Share with SMEs"]).toBe(
        "2025-01-10"
      );
      expect(result.props.initialFormData.notes["PO and OGD"]).toBe("Test note");
      expect(result.props.initialFormData.clearanceLevel).toBe("CMS (OSORA)");
      expect(result.props.isReadonly).toBe(false);
    });

    it("should pass through converted form data to ReviewPhase component", () => {
      const demonstration: ReviewPhaseDemonstration = {
        id: "demo-789",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Review",
            phaseDates: [
              { dateType: "Draft Approval Package Shared", dateValue: new Date("2025-06-15") },
              {
                dateType: "Package Sent for COMMs Clearance",
                dateValue: new Date("2025-07-20"),
              },
            ],
            phaseNotes: [
              { noteType: "OGC and OMB", content: "OGC note content" },
              { noteType: "COMMs Clearance", content: "COMMs note content" },
            ],
            phaseStatus: "Started",
          },
        ],
      };

      const result = getReviewPhaseComponentFromDemonstration(demonstration, mockOnFinish);

      expect(result.props.initialFormData.dates["Draft Approval Package Shared"]).toBe(
        "2025-06-15"
      );
      expect(result.props.initialFormData.dates["Package Sent for COMMs Clearance"]).toBe(
        "2025-07-20"
      );
      expect(result.props.initialFormData.notes["OGC and OMB"]).toBe("OGC note content");
      expect(result.props.initialFormData.notes["COMMs Clearance"]).toBe("COMMs note content");
      expect(result.props.initialFormData.clearanceLevel).toBe("CMS (OSORA)");
      expect(result.props.isReadonly).toBe(false);
      expect(result.props.onFinish).toBe(mockOnFinish);
    });

    it("should pass isReadonly as true if the phase is completed", () => {
      const demonstration: ReviewPhaseDemonstration = {
        id: "demo-789",
        clearanceLevel: "CMS (OSORA)",
        phases: [
          {
            phaseName: "Review",
            phaseDates: [
              { dateType: "Draft Approval Package Shared", dateValue: new Date("2025-06-15") },
              {
                dateType: "Package Sent for COMMs Clearance",
                dateValue: new Date("2025-07-20"),
              },
            ],
            phaseNotes: [
              { noteType: "OGC and OMB", content: "OGC note content" },
              { noteType: "COMMs Clearance", content: "COMMs note content" },
            ],
            phaseStatus: "Completed",
          },
        ],
      };

      const result = getReviewPhaseComponentFromDemonstration(demonstration, mockOnFinish);

      expect(result.props.isReadonly).toBe(true);
    });
  });

  describe("formatDataForSave", () => {
    it("should return empty arrays when form data has no dates or notes", () => {
      const formData: ReviewPhaseFormData = {
        dates: {},
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };

      const result = formatDataForSave(formData);

      expect(result.dates).toEqual([]);
      expect(result.notes).toEqual([]);
    });

    it("should format dates for saving", () => {
      const formData: ReviewPhaseFormData = {
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-15",
          "Draft Approval Package to Prep": "2025-02-20",
          "DDME Approval Received": "2025-03-10",
        },
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };

      const result = formatDataForSave(formData);

      expect(result.dates).toHaveLength(3);
      expect(result.dates).toContainEqual({
        dateType: "OGD Approval to Share with SMEs",
        dateValue: "2025-01-15",
      });
      expect(result.dates).toContainEqual({
        dateType: "Draft Approval Package to Prep",
        dateValue: "2025-02-20",
      });
      expect(result.dates).toContainEqual({
        dateType: "DDME Approval Received",
        dateValue: "2025-03-10",
      });
    });

    it("should format notes for saving", () => {
      const formData: ReviewPhaseFormData = {
        dates: {},
        notes: {
          "PO and OGD": "PO notes content",
          "OGC and OMB": "OGC notes content",
          "COMMs Clearance": "COMMs notes content",
        },
        clearanceLevel: "CMS (OSORA)",
      };

      const result = formatDataForSave(formData);

      expect(result.notes).toHaveLength(3);
      expect(result.notes).toContainEqual({
        noteType: "PO and OGD",
        content: "PO notes content",
      });
      expect(result.notes).toContainEqual({
        noteType: "OGC and OMB",
        content: "OGC notes content",
      });
      expect(result.notes).toContainEqual({
        noteType: "COMMs Clearance",
        content: "COMMs notes content",
      });
    });

    it("should skip undefined or empty date values", () => {
      const formData: ReviewPhaseFormData = {
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-15",
          "Draft Approval Package to Prep": undefined,
        },
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };

      const result = formatDataForSave(formData);

      expect(result.dates).toHaveLength(1);
      expect(result.dates[0]).toEqual({
        dateType: "OGD Approval to Share with SMEs",
        dateValue: "2025-01-15",
      });
    });

    it("should skip undefined or empty note values", () => {
      const formData: ReviewPhaseFormData = {
        dates: {},
        notes: {
          "PO and OGD": "Has content",
          "OGC and OMB": undefined,
          "COMMs Clearance": "",
        },
        clearanceLevel: "CMS (OSORA)",
      };

      const result = formatDataForSave(formData);

      expect(result.notes).toHaveLength(1);
      expect(result.notes[0]).toEqual({
        noteType: "PO and OGD",
        content: "Has content",
      });
    });
  });

  describe("hasFormChanges", () => {
    const baseFormData: ReviewPhaseFormData = {
      dates: {
        "OGD Approval to Share with SMEs": "2025-01-15",
        "Draft Approval Package to Prep": "2025-02-20",
      },
      notes: {
        "PO and OGD": "Original note",
        "OGC and OMB": "Another note",
      },
      clearanceLevel: "CMS (OSORA)",
    };

    it("should return false when form data is equal", () => {
      const activeFormData: ReviewPhaseFormData = {
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-15",
          "Draft Approval Package to Prep": "2025-02-20",
        },
        notes: {
          "PO and OGD": "Original note",
          "OGC and OMB": "Another note",
        },
        clearanceLevel: "CMS (OSORA)",
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(false);
    });

    it("should return true when a date value changes", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        dates: {
          ...baseFormData.dates,
          "OGD Approval to Share with SMEs": "2025-01-16",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when a new date is added", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        dates: {
          ...baseFormData.dates,
          "DDME Approval Received": "2025-03-10",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when a date is removed", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-15",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when a note value changes", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        notes: {
          ...baseFormData.notes,
          "PO and OGD": "Modified note",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when a new note is added", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        notes: {
          ...baseFormData.notes,
          "COMMs Clearance": "New note",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when a note is removed", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        notes: {
          "PO and OGD": "Original note",
        },
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should return true when clearance level is changed", () => {
      const activeFormData: ReviewPhaseFormData = {
        ...baseFormData,
        clearanceLevel: "COMMs",
      };

      const result = hasFormChanges(baseFormData, activeFormData);

      expect(result).toBe(true);
    });

    it("should handle empty form data", () => {
      const emptyOriginal: ReviewPhaseFormData = {
        dates: {},
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };
      const emptyActive: ReviewPhaseFormData = {
        dates: {},
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };

      const result = hasFormChanges(emptyOriginal, emptyActive);

      expect(result).toBe(false);
    });

    it("should return true when adding data to empty form", () => {
      const emptyOriginal: ReviewPhaseFormData = {
        dates: {},
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };
      const activeFormData: ReviewPhaseFormData = {
        dates: {
          "OGD Approval to Share with SMEs": "2025-01-15",
        },
        notes: {},
        clearanceLevel: "CMS (OSORA)",
      };

      const result = hasFormChanges(emptyOriginal, activeFormData);

      expect(result).toBe(true);
    });
  });
});
