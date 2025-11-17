import { ParsedApplicationDateInput, PhaseNameWithTrackedStatus } from "../../types.js";
import { makeApplicationDateMapFromList } from "../applicationDate";
import {
  ApplicationPhaseDocumentTypeRecord,
  ApplicationPhaseStatusRecord,
  PhaseCompletionValidationChecksRecord,
  checkApplicationDateExists,
  checkDocumentTypeExists,
  checkPhaseComplete,
  checkPhaseStartedBeforeCompletion,
} from ".";

const VALIDATION_CHECKS: PhaseCompletionValidationChecksRecord = {
  Concept: "No Validation",
  "Application Intake": {
    datesMustExist: ["State Application Submitted Date", "Completeness Review Due Date"],
    documentTypesMustExist: ["State Application"],
    phasesMustBeComplete: [],
  },
  Completeness: {
    datesMustExist: [
      "State Application Deemed Complete",
      "Federal Comment Period Start Date",
      "Federal Comment Period End Date",
    ],
    documentTypesMustExist: ["Application Completeness Letter"],
    phasesMustBeComplete: ["Application Intake"],
  },
  "Federal Comment": "No Validation",
  "SDG Preparation": {
    datesMustExist: [
      "Expected Approval Date",
      "SME Review Date",
      "FRT Initial Meeting Date",
      "BNPMT Initial Meeting Date",
    ],
    documentTypesMustExist: [],
    phasesMustBeComplete: ["Completeness", "Federal Comment"],
  },
  "OGC & OMB Review": "Not Implemented",
  "Approval Package": {
    datesMustExist: [],
    documentTypesMustExist: [
      "Final Budget Neutrality Formulation Workbook",
      "Q&A",
      "Special Terms & Conditions",
      "Formal OMB Policy Concurrence Email",
      "Approval Letter",
      "Signed Decision Memo",
    ],
    phasesMustBeComplete: ["OGC & OMB Review"],
  },
  "Post Approval": "Not Implemented",
};

export function validatePhaseCompletion(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  applicationDates: ParsedApplicationDateInput[],
  applicationDocumentTypes: ApplicationPhaseDocumentTypeRecord,
  applicationPhases: ApplicationPhaseStatusRecord
): void {
  const applicationDateMap = makeApplicationDateMapFromList(applicationDates);
  checkPhaseStartedBeforeCompletion(
    applicationId,
    phaseToValidate,
    applicationPhases[phaseToValidate]
  );

  const validationChecks = VALIDATION_CHECKS[phaseToValidate];
  if (validationChecks === "No Validation") {
    return;
  } else if (validationChecks === "Not Implemented") {
    throw new Error(`Validation of the ${phaseToValidate} phase via API is not yet implemented.`);
  }

  const datesToCheck = validationChecks.datesMustExist;
  const documentTypesToCheck = validationChecks.documentTypesMustExist;
  const phasesToCheckComplete = validationChecks.phasesMustBeComplete;

  if (datesToCheck.length !== 0) {
    for (const dateToCheck of datesToCheck) {
      checkApplicationDateExists(applicationId, phaseToValidate, dateToCheck, applicationDateMap);
    }
  }

  if (documentTypesToCheck.length !== 0) {
    for (const documentTypeToCheck of documentTypesToCheck) {
      checkDocumentTypeExists(
        applicationId,
        phaseToValidate,
        documentTypeToCheck,
        applicationDocumentTypes
      );
    }
  }

  if (phasesToCheckComplete.length !== 0) {
    for (const phaseToCheckComplete of phasesToCheckComplete) {
      checkPhaseComplete(applicationId, phaseToValidate, phaseToCheckComplete, applicationPhases);
    }
  }
}
