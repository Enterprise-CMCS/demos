import { PhaseNameWithTrackedStatus } from "../../types.js";
import {
  ParsedApplicationDateInput,
  makeApplicationDateMapFromList,
  checkInputDateGreaterThanOrEqual,
} from "../applicationDate";
import {
  ApplicationPhaseDocumentTypeRecord,
  ApplicationPhaseStatusRecord,
  PhaseCompletionValidationChecksRecord,
  checkApplicationDateExistsForCompletion,
  checkDocumentTypeExistsForCompletion,
  checkPriorPhaseCompleteForCompletion,
  checkPhaseStartedBeforeCompletion,
} from ".";

const VALIDATION_CHECKS: PhaseCompletionValidationChecksRecord = {
  Concept: {
    datesMustExist: ["Pre-Submission Submitted Date"],
    documentTypesMustExist: ["Pre-Submission"],
    phasesMustBeComplete: [],
  },
  "Application Intake": {
    datesMustExist: [
      "State Application Submitted Date",
      "Completeness Review Due Date",
    ],
    documentTypesMustExist: ["State Application"],
    phasesMustBeComplete: [],
  },
  Completeness: {
    datesMustExist: [
      "State Application Deemed Complete",
      "Federal Comment Period Start Date",
      "Federal Comment Period End Date",
    ],
    documentTypesMustExist: [
      "Application Completeness Letter",
      "Internal Completeness Review Form",
    ],
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
    phasesMustBeComplete: [
      "Application Intake",
      "Completeness",
      "Federal Comment",
    ],
  },
  Review: {
    datesMustExist: [
      "OGC Approval to Share with SMEs",
      "Draft Approval Package to Prep",
      "DDME Approval Received",
      "State Concurrence",
      "BN PMT Approval to Send to OMB",
      "Draft Approval Package Shared",
      "Receive OMB Concurrence",
      "Receive OGC Legal Clearance",
    ],
    documentTypesMustExist: [],
    phasesMustBeComplete: [
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
    ],
  },
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
    phasesMustBeComplete: [
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
      "Review",
    ],
  },
  "Post Approval": "Not Implemented",
};

export function checkPhaseCompletionRules(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  applicationDates: ParsedApplicationDateInput[],
  applicationDocumentTypes: ApplicationPhaseDocumentTypeRecord,
  applicationPhases: ApplicationPhaseStatusRecord,
): void {
  const validationChecks = VALIDATION_CHECKS[phaseToValidate];
  if (validationChecks === "No Validation") {
    return;
  } else if (validationChecks === "Not Implemented") {
    throw new Error(
      `Validation of the ${phaseToValidate} phase via API is not yet implemented.`,
    );
  }

  checkPhaseStartedBeforeCompletion(
    applicationId,
    phaseToValidate,
    applicationPhases[phaseToValidate],
  );

  const applicationDateMap = makeApplicationDateMapFromList(applicationDates);
  const datesToCheck = validationChecks.datesMustExist;
  const documentTypesToCheck = validationChecks.documentTypesMustExist;
  const phasesToCheckComplete = validationChecks.phasesMustBeComplete;

  if (datesToCheck.length !== 0) {
    for (const dateToCheck of datesToCheck) {
      checkApplicationDateExistsForCompletion(
        applicationId,
        phaseToValidate,
        dateToCheck,
        applicationDateMap,
      );
    }
  }

  if (documentTypesToCheck.length !== 0) {
    for (const documentTypeToCheck of documentTypesToCheck) {
      checkDocumentTypeExistsForCompletion(
        applicationId,
        phaseToValidate,
        documentTypeToCheck,
        applicationDocumentTypes,
      );
    }
  }

  if (phasesToCheckComplete.length !== 0) {
    for (const phaseToCheckComplete of phasesToCheckComplete) {
      checkPriorPhaseCompleteForCompletion(
        applicationId,
        phaseToValidate,
        phaseToCheckComplete,
        applicationPhases,
      );
    }
  }

  // Special validation for Review phase: Review Completion Date must be >= Review Start Date
  if (phaseToValidate === "Review") {
    const reviewStartDate = applicationDateMap.get("Review Start Date");
    const reviewCompletionDate = applicationDateMap.get(
      "Review Completion Date",
    );

    if (reviewStartDate && reviewCompletionDate) {
      try {
        checkInputDateGreaterThanOrEqual(
          applicationDateMap,
          "Review Completion Date",
          "Review Start Date",
        );
      } catch (error) {
        throw new Error(
          `Review phase for application ${applicationId} requires Review Completion Date ` +
            `to be greater than or equal to Review Start Date. ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
