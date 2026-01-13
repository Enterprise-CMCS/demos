import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkPhaseCompletionRules } from "./checkPhaseCompletionRules.js";

// Mock imports
import {
  ApplicationPhaseStatusRecord,
  checkApplicationDateExistsForCompletion,
  checkDocumentTypeExistsForCompletion,
  checkPriorPhaseCompleteForCompletion,
  checkPhaseStartedBeforeCompletion,
} from ".";
import { makeApplicationDateMapFromList } from "../applicationDate";
import { ClearanceLevel } from "../../types.js";
vi.mock(".", () => ({
  checkApplicationDateExistsForCompletion: vi.fn(),
  checkDocumentTypeExistsForCompletion: vi.fn(),
  checkPriorPhaseCompleteForCompletion: vi.fn(),
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
    Review: "Started",
    "Approval Package": "Started",
    "Approval Summary": "Started",
  };
  const testApplicationDateMapReturn: any = "Test Mapped Date Return";
  const testApplicationClearanceLevel = "CMS (OSORA)" satisfies ClearanceLevel;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(makeApplicationDateMapFromList).mockReturnValue(testApplicationDateMapReturn);
  });

  describe("Concept Phase", () => {
    it("should run expected checks for the Application Intake phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Concept",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Concept",
        "Started"
      );
      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
        [
          testApplicationId,
          "Concept",
          "Pre-Submission Submitted Date",
          testApplicationDateMapReturn,
        ],
      ]);
      expect(vi.mocked(checkDocumentTypeExistsForCompletion).mock.calls).toEqual([
        [testApplicationId, "Concept", "Pre-Submission", testApplicationDocumentTypes],
      ]);
      expect(checkPriorPhaseCompleteForCompletion).not.toBeCalled();
    });
  });

  describe("Application Intake Phase", () => {
    it("should run expected checks for the Application Intake phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Application Intake",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Application Intake",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
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
      expect(vi.mocked(checkDocumentTypeExistsForCompletion).mock.calls).toEqual([
        [
          testApplicationId,
          "Application Intake",
          "State Application",
          testApplicationDocumentTypes,
        ],
      ]);
      expect(checkPriorPhaseCompleteForCompletion).not.toBeCalled();
    });
  });

  describe("Completeness Phase", () => {
    it("should run expected checks for the Completeness phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Completeness",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Completeness",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
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
      expect(vi.mocked(checkDocumentTypeExistsForCompletion).mock.calls).toEqual([
        [
          testApplicationId,
          "Completeness",
          "Application Completeness Letter",
          testApplicationDocumentTypes,
        ],
        [
          testApplicationId,
          "Completeness",
          "Internal Completeness Review Form",
          testApplicationDocumentTypes,
        ],
      ]);
      expect(vi.mocked(checkPriorPhaseCompleteForCompletion).mock.calls).toEqual([
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
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).not.toBeCalled();
      expect(checkPhaseStartedBeforeCompletion).not.toBeCalled();
      expect(checkApplicationDateExistsForCompletion).not.toBeCalled();
      expect(checkDocumentTypeExistsForCompletion).not.toBeCalled();
      expect(checkPriorPhaseCompleteForCompletion).not.toBeCalled();
    });
  });

  describe("SDG Preparation Phase", () => {
    it("should run expected checks for the SDG Preparation phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "SDG Preparation",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "SDG Preparation",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
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
      expect(checkDocumentTypeExistsForCompletion).not.toBeCalled();
      expect(vi.mocked(checkPriorPhaseCompleteForCompletion).mock.calls).toEqual([
        [testApplicationId, "SDG Preparation", "Application Intake", testApplicationPhases],
        [testApplicationId, "SDG Preparation", "Completeness", testApplicationPhases],
        [testApplicationId, "SDG Preparation", "Federal Comment", testApplicationPhases],
      ]);
    });
  });

  describe("Review Phase", () => {
    it("should run expected checks for the Review phase when clearance level is CMS (OSORA)", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Review",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
        [
          testApplicationId,
          "Review",
          "OGD Approval to Share with SMEs",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Review",
          "Draft Approval Package to Prep",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "DDME Approval Received", testApplicationDateMapReturn],
        [testApplicationId, "Review", "State Concurrence", testApplicationDateMapReturn],
        [
          testApplicationId,
          "Review",
          "BN PMT Approval to Send to OMB",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Review",
          "Draft Approval Package Shared",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "Receive OMB Concurrence", testApplicationDateMapReturn],
        [testApplicationId, "Review", "Receive OGC Legal Clearance", testApplicationDateMapReturn],
        [
          testApplicationId,
          "Review",
          "Submit Approval Package to OSORA",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "OSORA R1 Comments Due", testApplicationDateMapReturn],
        [testApplicationId, "Review", "OSORA R2 Comments Due", testApplicationDateMapReturn],
        [testApplicationId, "Review", "CMS (OSORA) Clearance End", testApplicationDateMapReturn],
      ]);
      expect(checkDocumentTypeExistsForCompletion).not.toBeCalled();
      expect(vi.mocked(checkPriorPhaseCompleteForCompletion).mock.calls).toEqual([
        [testApplicationId, "Review", "Application Intake", testApplicationPhases],
        [testApplicationId, "Review", "Completeness", testApplicationPhases],
        [testApplicationId, "Review", "Federal Comment", testApplicationPhases],
        [testApplicationId, "Review", "SDG Preparation", testApplicationPhases],
      ]);
    });

    it("should run expected checks for the Review phase when clearance level is COMMs", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Review",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        "COMMs"
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Review",
        "Started"
      );
      expect(vi.mocked(checkApplicationDateExistsForCompletion).mock.calls).toEqual([
        [
          testApplicationId,
          "Review",
          "OGD Approval to Share with SMEs",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Review",
          "Draft Approval Package to Prep",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "DDME Approval Received", testApplicationDateMapReturn],
        [testApplicationId, "Review", "State Concurrence", testApplicationDateMapReturn],
        [
          testApplicationId,
          "Review",
          "BN PMT Approval to Send to OMB",
          testApplicationDateMapReturn,
        ],
        [
          testApplicationId,
          "Review",
          "Draft Approval Package Shared",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "Receive OMB Concurrence", testApplicationDateMapReturn],
        [testApplicationId, "Review", "Receive OGC Legal Clearance", testApplicationDateMapReturn],
        [
          testApplicationId,
          "Review",
          "Package Sent for COMMs Clearance",
          testApplicationDateMapReturn,
        ],
        [testApplicationId, "Review", "COMMs Clearance Received", testApplicationDateMapReturn],
      ]);
      expect(checkDocumentTypeExistsForCompletion).not.toBeCalled();
      expect(vi.mocked(checkPriorPhaseCompleteForCompletion).mock.calls).toEqual([
        [testApplicationId, "Review", "Application Intake", testApplicationPhases],
        [testApplicationId, "Review", "Completeness", testApplicationPhases],
        [testApplicationId, "Review", "Federal Comment", testApplicationPhases],
        [testApplicationId, "Review", "SDG Preparation", testApplicationPhases],
      ]);
    });
  });

  describe("Approval Package Phase", () => {
    it("should run expected checks for the Approval Package phase", () => {
      checkPhaseCompletionRules(
        testApplicationId,
        "Approval Package",
        testApplicationDates,
        testApplicationDocumentTypes,
        testApplicationPhases,
        testApplicationClearanceLevel
      );

      expect(makeApplicationDateMapFromList).toHaveBeenCalledExactlyOnceWith(testApplicationDates);
      expect(checkPhaseStartedBeforeCompletion).toHaveBeenCalledExactlyOnceWith(
        testApplicationId,
        "Approval Package",
        "Started"
      );
      expect(checkApplicationDateExistsForCompletion).not.toBeCalled();
      expect(vi.mocked(checkDocumentTypeExistsForCompletion).mock.calls).toEqual([
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
      expect(vi.mocked(checkPriorPhaseCompleteForCompletion).mock.calls).toEqual([
        [testApplicationId, "Approval Package", "Application Intake", testApplicationPhases],
        [testApplicationId, "Approval Package", "Completeness", testApplicationPhases],
        [testApplicationId, "Approval Package", "Federal Comment", testApplicationPhases],
        [testApplicationId, "Approval Package", "SDG Preparation", testApplicationPhases],
        [testApplicationId, "Approval Package", "Review", testApplicationPhases],
      ]);
    });
  });

  describe("Approval Summary", () => {
    it("should throw since the Approval Summary phase is not implemented", () => {
      expect(() =>
        checkPhaseCompletionRules(
          testApplicationId,
          "Approval Summary",
          testApplicationDates,
          testApplicationDocumentTypes,
          testApplicationPhases,
          testApplicationClearanceLevel
        )
      ).toThrowError("Validation of the Approval Summary phase via API is not yet implemented.");
    });
  });
});
