import {
  DateType,
  DocumentType,
  ParsedApplicationDateInput,
  PhaseNameWithTrackedStatus,
} from "../../types.js";
import { makeApplicationDateMapFromList } from "../applicationDate/validateInputDates.js";
import {
  ApplicationPhaseStatusRecord,
  ApplicationPhaseDocumentTypeRecord,
} from "./phaseValidationPayloadCreationFunctions.js";

type ValidationChecks = {
  datesMustExist: DateType[];
  documentTypesMustExist: DocumentType[];
  phasesMustBeComplete: PhaseNameWithTrackedStatus[];
};

type PhaseCompletionValidationChecksRecord = Record<
  PhaseNameWithTrackedStatus,
  ValidationChecks | "No Validation" | "Not Implemented"
>;

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
  phaseToValidate: PhaseNameWithTrackedStatus,
  applicationDates: ParsedApplicationDateInput[],
  applicationDocumentTypes: ApplicationPhaseDocumentTypeRecord,
  applicationPhases: ApplicationPhaseStatusRecord,
  applicationId: string
): void {
  const currentPhaseStatus = applicationPhases[phaseToValidate];
  if (currentPhaseStatus !== "Started") {
    throw new Error(
      `${phaseToValidate} phase for application ${applicationId} ` +
        `has status ${currentPhaseStatus}; cannot complete a phase unless it has status of Started.`
    );
  }

  const applicationDateMap = makeApplicationDateMapFromList(applicationDates);

  const validationChecks = VALIDATION_CHECKS[phaseToValidate];
  if (validationChecks === "No Validation") {
    return;
  } else if (validationChecks === "Not Implemented") {
    throw new Error(`Validation of the ${phaseToValidate} phase via API is not yet implemented.`);
  }

  const datesToCheck = validationChecks.datesMustExist;
  const documentTypesToCheck = validationChecks.documentTypesMustExist;
  const phasesToCheck = validationChecks.phasesMustBeComplete;

  if (datesToCheck.length !== 0) {
    for (const dateToCheck of datesToCheck) {
      const check = applicationDateMap.get(dateToCheck);
      if (!check) {
        throw new Error(
          `To complete the ${phaseToValidate} phase, the date ${dateToCheck} must exist, but it does not.`
        );
      }
    }
  }

  if (documentTypesToCheck.length !== 0) {
    for (const documentTypeToCheck of documentTypesToCheck) {
      const check = applicationDocumentTypes[phaseToValidate].includes(documentTypeToCheck);
      if (!check) {
        throw new Error(
          `To complete the ${phaseToValidate} phase, the document type ${documentTypeToCheck} must exist, but it does not.`
        );
      }
    }
  }

  if (phasesToCheck.length !== 0) {
    for (const phaseToCheck of phasesToCheck) {
      const check = applicationPhases[phaseToCheck] === "Completed";
      if (!check) {
        throw new Error(
          `To complete the ${phaseToValidate} phase, the phase ${phaseToCheck} must be Completed, but it is not.`
        );
      }
    }
  }
}
