import { describe, it, expect } from "vitest";
import { DateType, DocumentType, PhaseNameWithTrackedStatus } from "../../types.js";
import {
  checkApplicationDateExistsForCompletion,
  checkConceptPhaseStartedBeforeSkipping,
  checkDocumentTypeExistsForCompletion,
  checkPhaseStartedBeforeCompletion,
  checkPriorPhaseCompleteForCompletion,
} from "./checkPhaseFunctions.js";
import { ApplicationDateMap } from "../applicationDate/applicationDateTypes.js";
import { ApplicationPhaseDocumentTypeRecord, ApplicationPhaseStatusRecord } from ".";

describe("checkPhaseFunctions", () => {
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

  describe("checkConceptPhaseStartedBeforeSkipping", () => {
    it("should throw if trying to skip the Concept phase and it is not Started", () => {
      const expectedError =
        `Concept phase for application ${testApplicationId} ` +
        `has status Not Started; cannot skip the phase unless it has status of Started.`;
      expect(() =>
        checkConceptPhaseStartedBeforeSkipping(testApplicationId, "Not Started")
      ).toThrowError(expectedError);
    });

    it("should not throw if trying to skip the Concept phase when it is Started", () => {
      expect(() =>
        checkConceptPhaseStartedBeforeSkipping(testApplicationId, "Started")
      ).not.toThrow();
    });
  });

  describe("checkApplicationDateExistsForCompletion", () => {
    it("should throw if trying to complete a phase with a missing date", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        ["Concept Start Date", new Date("2025-01-01T00:11:22.333Z")],
      ]);
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires the ` +
        `date ${testDateTypeToCheck} to exist before phase completion, but it does not.`;
      expect(() =>
        checkApplicationDateExistsForCompletion(
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
        checkApplicationDateExistsForCompletion(
          testApplicationId,
          testPhaseName,
          testDateTypeToCheck,
          testApplicationDateMap
        )
      ).not.toThrow();
    });
  });

  describe("checkDocumentTypeExistsForCompletion", () => {
    it("should throw if trying to complete a phase with a missing document type", () => {
      const testApplicationDocumentTypes: Partial<ApplicationPhaseDocumentTypeRecord> = {
        Completeness: ["Internal Completeness Review Form"],
      };
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires at ` +
        `least one document of type ${testDocumentTypetoCheck} to exist, but none do.`;
      expect(() =>
        checkDocumentTypeExistsForCompletion(
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
        checkDocumentTypeExistsForCompletion(
          testApplicationId,
          testPhaseName,
          testDocumentTypetoCheck,
          testApplicationDocumentTypes as ApplicationPhaseDocumentTypeRecord
        )
      ).not.toThrow();
    });
  });

  describe("checkPriorPhaseCompleteForCompletion", () => {
    it("should throw if trying to complete a phase if the required previous phase is not Completed", () => {
      const testApplicationPhases: Partial<ApplicationPhaseStatusRecord> = {
        "Application Intake": "Started",
      };
      const expectedError =
        `${testPhaseName} phase for application ${testApplicationId} requires the phase ` +
        `${testPhaseToCheckComplete} to be status Completed, but it is Started.`;
      expect(() =>
        checkPriorPhaseCompleteForCompletion(
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
        checkPriorPhaseCompleteForCompletion(
          testApplicationId,
          testPhaseName,
          testPhaseToCheckComplete,
          testApplicationPhases as ApplicationPhaseStatusRecord
        )
      ).not.toThrow();
    });
  });
});
