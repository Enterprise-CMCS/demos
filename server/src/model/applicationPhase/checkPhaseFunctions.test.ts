import { describe, it, expect } from "vitest";
import { DateType, DocumentType, PhaseNameWithTrackedStatus } from "../../types.js";
import {
  checkApplicationDateExistsForCompletion,
  checkConceptPhaseStartedBeforeSkipping,
  checkDocumentTypeExistsForCompletion,
  checkPhaseStartedBeforeCompletion,
  checkPhaseStatus,
  checkPriorPhaseCompleteForCompletion,
} from "./checkPhaseFunctions.js";
import { ApplicationDateMap } from "../applicationDate/applicationDateTypes.js";
import {
  ApplicationPhaseDocumentTypeRecord,
  ApplicationPhaseStatusRecord,
  checkApplicationIntakeStatusForIncomplete,
  checkCompletenessStatusForIncomplete,
} from ".";
import { TZDate } from "@date-fns/tz";

describe("checkPhaseFunctions", () => {
  const testApplicationId = "5a947103-3ad5-4237-96cd-3eaeb0c88541";
  const testPhaseName: PhaseNameWithTrackedStatus = "Completeness";
  const testDateTypeToCheck: DateType = "Expected Approval Date";
  const testDocumentTypetoCheck: DocumentType = "Final BN Worksheet";
  const testPhaseToCheckComplete: PhaseNameWithTrackedStatus = "Application Intake";

  describe("checkPhaseStatus", () => {
    it("should throw the passed error message if the expected doesn't match", () => {
      const testError = "Something is awry with your code!";
      expect(() => checkPhaseStatus("Completed", "Not Started", testError)).toThrowError(testError);
    });

    it("should not throw if the statuses are the same", () => {
      const testError = "Something is awry with your code!";

      expect(() => checkPhaseStatus("Completed", "Completed", testError)).not.toThrowError();
    });
  });

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

  describe("checkCompletenessStatusForIncomplete", () => {
    it("should throw a proper message if Completeness phase is not Started", () => {
      const expectedError =
        `Completeness phase for application ${testApplicationId} ` +
        `has status Not Started; cannot declare the Completeness phase ` +
        `Incomplete unless Completeness has the status of Started.`;
      expect(() =>
        checkCompletenessStatusForIncomplete(testApplicationId, "Not Started")
      ).toThrowError(expectedError);
    });

    it("should not throw if Completeness is Started", () => {
      expect(() =>
        checkCompletenessStatusForIncomplete(testApplicationId, "Started")
      ).not.toThrow();
    });
  });

  describe("checkApplicationIntakeStatusForIncomplete", () => {
    it("should throw a proper message if Application Intake phase is not Completed", () => {
      const expectedError =
        `Application Intake phase for application ${testApplicationId} ` +
        `has status Not Started; cannot declare the Completeness phase ` +
        `Incomplete unless Application Intake has the status of Completed.`;
      expect(() =>
        checkApplicationIntakeStatusForIncomplete(testApplicationId, "Not Started")
      ).toThrowError(expectedError);
    });

    it("should not throw if Application Intake is Completed", () => {
      expect(() =>
        checkApplicationIntakeStatusForIncomplete(testApplicationId, "Completed")
      ).not.toThrow();
    });
  });

  describe("checkApplicationDateExistsForCompletion", () => {
    it("should throw if trying to complete a phase with a missing date", () => {
      const testApplicationDateMap: ApplicationDateMap = new Map([
        [
          "Concept Start Date",
          {
            isEasternTZDate: true,
            easternTZDate: new TZDate("2025-01-01T00:11:22.333-05:00", "America/New_York"),
          },
        ],
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
        [
          testDateTypeToCheck,
          {
            isEasternTZDate: true,
            easternTZDate: new TZDate("2025-01-01T00:11:22.333-05:00", "America/New_York"),
          },
        ],
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
