import { describe, it, expect } from "vitest";
import { DateType, DocumentType, PhaseNameWithTrackedStatus } from "../../types.js";
import {
  checkApplicationDateExists,
  checkDocumentTypeExists,
  checkPriorPhaseComplete,
  checkPhaseStartedBeforeCompletion,
} from "./checkPhaseCompletionFunctions.js";
import { ApplicationDateMap } from "../applicationDate/applicationDateTypes.js";
import { ApplicationPhaseDocumentTypeRecord, ApplicationPhaseStatusRecord } from ".";

describe("checkInputDateFunctions", () => {
  const testApplicationId = "5a947103-3ad5-4237-96cd-3eaeb0c88541";
  const testPhaseName: PhaseNameWithTrackedStatus = "Completeness";
  const testDateTypeToCheck: DateType = "Expected Approval Date";
  const testDocumentTypetoCheck: DocumentType = "Final BN Worksheet";
  const testPhaseToCheckComplete: PhaseNameWithTrackedStatus = "Application Intake";

  describe("checkPhaseStartedBeforeCompletion", () => {
    it("should throw if trying to complete a phase that has not been started", () => {
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} ` +
        `has status Not Started; cannot complete a phase unless it has status of Started.`;
      expect(() =>
        checkPhaseStartedBeforeCompletion(testApplicationId, testPhaseName, "Not Started")
      ).toThrowError(expectedError);
    });

    it("should not throw if trying to complete a phase that has been started", () => {
      expect(() =>
        checkPhaseStartedBeforeCompletion(testApplicationId, testPhaseName, "Started")
      ).not.toThrow();
    });
  });

  describe("checkApplicationDateExists", () => {
    it("should throw if trying to complete a phase with a missing date", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Concept Start Date", new Date("2025-01-01T00:11:22.333Z")],
      ]);
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires the ` +
        `date ${testDateTypeToCheck} to exist before phase completion, but it does not.`;
      expect(() =>
        checkApplicationDateExists(
          testApplicationId,
          testPhaseName,
          testDateTypeToCheck,
          testApplicationDateMap
        )
      ).toThrowError(expectedError);
    });

    it("should not throw if trying to complete a phase where the date isn't missing", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [testDateTypeToCheck, new Date("2025-01-01T00:11:22.333Z")],
      ]);
      expect(() =>
        checkApplicationDateExists(
          testApplicationId,
          testPhaseName,
          testDateTypeToCheck,
          testApplicationDateMap
        )
      ).not.toThrow();
    });
  });

  describe("checkDocumentTypeExists", () => {
    it("should throw if trying to complete a phase with a missing document type", () => {
      const testApplicationDocumentTypes: Partial<ApplicationPhaseDocumentTypeRecord> = {
        Completeness: ["Internal Completeness Review Form"],
      };
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires at ` +
        `least one document of type ${testDocumentTypetoCheck} to exist, but none do.`;
      expect(() =>
        checkDocumentTypeExists(
          testApplicationId,
          testPhaseName,
          testDocumentTypetoCheck,
          testApplicationDocumentTypes as ApplicationPhaseDocumentTypeRecord
        )
      ).toThrowError(expectedError);
    });

    it("should not throw if trying to complete a phase where the document type isn't missing", () => {
      const testApplicationDocumentTypes: Partial<ApplicationPhaseDocumentTypeRecord> = {
        Completeness: [testDocumentTypetoCheck],
      };
      expect(() =>
        checkDocumentTypeExists(
          testApplicationId,
          testPhaseName,
          testDocumentTypetoCheck,
          testApplicationDocumentTypes as ApplicationPhaseDocumentTypeRecord
        )
      ).not.toThrow();
    });
  });

  describe("checkPriorPhaseComplete", () => {
    it("should throw if trying to complete a phase if the required previous phase is not Completed", () => {
      const testApplicationPhases: Partial<ApplicationPhaseStatusRecord> = {
        "Application Intake": "Started",
      };
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires the phase ` +
        `${testPhaseToCheckComplete} to be status Completed, but it is Started.`;
      expect(() =>
        checkPriorPhaseComplete(
          testApplicationId,
          testPhaseName,
          testPhaseToCheckComplete,
          testApplicationPhases as ApplicationPhaseStatusRecord
        )
      ).toThrowError(expectedError);
    });

    it("should not throw if trying to complete a phase where the required previous phase is Completed", () => {
      const testApplicationPhases: Partial<ApplicationPhaseStatusRecord> = {
        "Application Intake": "Completed",
      };
      expect(() =>
        checkPriorPhaseComplete(
          testApplicationId,
          testPhaseName,
          testPhaseToCheckComplete,
          testApplicationPhases as ApplicationPhaseStatusRecord
        )
      ).not.toThrow();
    });
  });
});
