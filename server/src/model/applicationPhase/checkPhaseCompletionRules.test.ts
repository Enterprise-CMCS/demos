import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPhaseCompletionRules } from "./checkPhaseCompletionRules.js";

// Mock imports
import {
  ApplicationPhaseStatusRecord,
  checkApplicationDateExists,
  checkDocumentTypeExists,
  checkPriorPhaseComplete,
  checkPhaseStartedBeforeCompletion,
} from ".";
import { makeApplicationDateMapFromList } from "../applicationDate";

vi.mock(".", () => ({
  checkApplicationDateExists: vi.fn(),
  checkDocumentTypeExists: vi.fn(),
  checkPriorPhaseComplete: vi.fn(),
  checkPhaseStartedBeforeCompletion: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  makeApplicationDateMapFromList: vi.fn(),
}));

describe("checkPhaseCompletionRules", () => {
  const testApplicationId = "78927fea-36fb-4be6-b4e5-fa355b489d35";
  const testApplicationDates: any = "Test Dates";
  const testApplicationDocumentTypes: any = "Test Document Types";
  const testApplicationPhases: ApplicationPhaseStatusRecord = {
    Concept: "Started",
    "Application Intake": "Started",
    Completeness: "Started",
    "Federal Comment": "Started",
    "SDG Preparation": "Started",
    "OGC & OMB Review": "Started",
    "Approval Package": "Started",
    "Post Approval": "Started",
  };
  const testApplicationDateMapReturn: any = "Test Mapped Date Return";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(makeApplicationDateMapFromList).mockReturnValue(testApplicationDateMapReturn);
  });

  describe("Concept Phase", () => {
    it("should bypass checks for the Concept phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Concept",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).not.toBeCalled();
      expect(checkPhaseStartedBeforeCompletion).not.toBeCalled();
      expect(checkApplicationDateExists).not.toBeCalled();
      expect(checkDocumentTypeExists).not.toBeCalled();
      expect(checkPriorPhaseComplete).not.toBeCalled();
    });
  });

  describe("Application Intake Phase", () => {
    it("should run expected checks for the Application Intake phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Application Intake",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExists).mock.calls).toEqual([
        [
          testApplicationId,
          "Application Intake",
          "State Application Submitted Date",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Application Intake",
          "Completeness Review Due Date",
          testApplicationDateMapReturn,
        ],
      ]);
      expect(vi.mocked(checkDocumentTypeExists).mock.calls).toEqual([
        [
          testApplicationId,
          "Application Intake",
          "State Application",
          testApplicationDocumentTypes,
        ],
      ]);
      expect(checkPriorPhaseComplete).not.toBeCalled();
    });
  });

  describe("Completeness Phase", () => {
    it("should run expected checks for the Completeness phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Completeness",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Completeness",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExists).mock.calls).toEqual([
        [
          testApplicationId,
          "Completeness",
          "State Application Deemed Complete",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Completeness",
          "Federal Comment Period Start Date",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Completeness",
          "Federal Comment Period End Date",
          testApplicationDateMapReturn,
        ],
      ]);
      expect(vi.mocked(checkDocumentTypeExists).mock.calls).toEqual([
        [
          testApplicationId,
          "Completeness",
          "Application Completeness Letter",
          testApplicationDocumentTypes,
        ],
      ]);
      expect(vi.mocked(checkPriorPhaseComplete).mock.calls).toEqual([
        [testApplicationId, "Completeness", "Application Intake", testApplicationPhases],
      ]);
    });
  });

  describe("Federal Comment Phase", () => {
    it("should bypass checks for the Federal Comment phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Federal Comment",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).not.toBeCalled();
      expect(checkPhaseStartedBeforeCompletion).not.toBeCalled();
      expect(checkApplicationDateExists).not.toBeCalled();
      expect(checkDocumentTypeExists).not.toBeCalled();
      expect(checkPriorPhaseComplete).not.toBeCalled();
    });
  });

  describe("SDG Preparation Phase", () => {
    it("should run expected checks for the SDG Preparation phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "SDG Preparation",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "SDG Preparation",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExists).mock.calls).toEqual([
        [
          testApplicationId,
          "SDG Preparation",
          "Expected Approval Date",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "SDG Preparation", "SME Review Date", testApplicationDateMapReturn],
        [
          testApplicationId,
          "SDG Preparation",
          "FRT Initial Meeting Date",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "SDG Preparation",
          "BNPMT Initial Meeting Date",
          testApplicationDateMapReturn,
        ],
      ]);
      expect(checkDocumentTypeExists).not.toBeCalled();
      expect(vi.mocked(checkPriorPhaseComplete).mock.calls).toEqual([
        [testApplicationId, "SDG Preparation", "Completeness", testApplicationPhases],
        [testApplicationId, "SDG Preparation", "Federal Comment", testApplicationPhases],
      ]);
    });
  });

  describe("OGC & OMB Review Phase", () => {
    it("should throw since the OGC & OMB Review phase is not implemented", () => {
      expect(() =>
        checkPhaseCompletionRules(
          testApplicationId,
          "OGC & OMB Review",
          testApplicationDates,
          testApplicationDocumentTypes,
          testApplicationPhases
        )
      ).toThrowError("Validation of the OGC & OMB Review phase via API is not yet implemented.");
    });
  });

  describe("Approval Package Phase", () => {
    it("should run expected checks for the Approval Package phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Approval Package",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Package",
        "Started"
      );
      expect(checkApplicationDateExists).not.toBeCalled();
      expect(vi.mocked(checkDocumentTypeExists).mock.calls).toEqual([
        [
          testApplicationId,
          "Approval Package",
          "Final Budget Neutrality Formulation Workbook",
          testApplicationDocumentTypes,
        ],
        [testApplicationId, "Approval Package", "Q&A", testApplicationDocumentTypes],
        [
          testApplicationId,
          "Approval Package",
          "Special Terms & Conditions",
          testApplicationDocumentTypes,
        ],
        [
          testApplicationId,
          "Approval Package",
          "Formal OMB Policy Concurrence Email",
          testApplicationDocumentTypes,
        ],
        [testApplicationId, "Approval Package", "Approval Letter", testApplicationDocumentTypes],
        [
          testApplicationId,
          "Approval Package",
          "Signed Decision Memo",
          testApplicationDocumentTypes,
        ],
      ]);
      expect(vi.mocked(checkPriorPhaseComplete).mock.calls).toEqual([
        [testApplicationId, "Approval Package", "OGC & OMB Review", testApplicationPhases],
      ]);
    });
  });

  describe("Post Approval", () => {
    it("should throw since the Post Approval phase is not implemented", () => {
      expect(() =>
        checkPhaseCompletionRules(
          testApplicationId,
          "Post Approval",
          testApplicationDates,
          testApplicationDocumentTypes,
          testApplicationPhases
        )
      ).toThrowError("Validation of the Post Approval phase via API is not yet implemented.");
    });
  });
});
