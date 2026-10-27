import { ClearanceLevel, PhaseName } from "../../types.js";
import { ParsedApplicationDateInput, makeApplicationDateMapFromList } from "../applicationDate";
import {
  ApplicationPhaseDocumentTypeRecord,
  ApplicationPhaseStatusRecord,
  PhaseCompletionValidationChecksRecord,
  checkApplicationDateExistsForCompletion,
  checkDocumentTypeExistsForCompletion,
  checkPriorPhaseCompleteForCompletion,
  checkPhaseStartedBeforeCompletion,
} from ".";
import {
  APPROVAL_PACKAGE_PHASE_DOCUMENTS,
  CMS_OSORA_CLEARANCE_DATE_TYPES,
  COMMS_CLEARANCE_DATE_TYPES,
  START_OF_2027_EASTERN,
} from "../../constants.js";
import { TZDate } from "@date-fns/tz";

export const START_OF_2027_EASTERN = new TZDate(2027, 0, 1, 0, 0, 0, 0, "America/New_York");

const VALIDATION_CHECKS: PhaseCompletionValidationChecksRecord = {
  Concept: {
    datesMustExist: ["Concept Paper Submitted Date"],
    documentTypesMustExist: ["Pre-Submission"],
    phasesMustBeComplete: [],
  },
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
    documentTypesMustExist: [
      "Application Completeness Letter",
      "Internal Completeness Review Form",
    ],
    phasesMustBeComplete: ["Application Intake"],
  },
  "Federal Comment": "No Validation",
  "SDG Preparation": {
    datesMustExist: [
      "Internal Expected Approval Date",
      "SME Initial Review Date",
      "FRT Initial Meeting Date",
      "BNPMT Initial Meeting Date",
    ],
    documentTypesMustExist: [],
    phasesMustBeComplete: ["Application Intake", "Completeness", "Federal Comment"],
  },
  Review: {
    datesMustExist: [
      "OGD Approval to Share with SMEs",
      "Draft Approval Package to Prep",
      "DDME Approval Received",
      "State Concurrence",
      "BN PMT Approval to Send to OMB",
      "Draft Approval Package Shared",
      "Receive OMB Concurrence",
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
    documentTypesMustExist: APPROVAL_PACKAGE_PHASE_DOCUMENTS,
    phasesMustBeComplete: [
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
      "Review",
    ],
  },
  "Approval Summary": {
    datesMustExist: [
      "Application Details Marked Complete Date",
      "Application Demonstration Types Marked Complete Date",
      "Application Approval Date",
    ],
    documentTypesMustExist: [],
    phasesMustBeComplete: [
      "Application Intake",
      "Completeness",
      "Federal Comment",
      "SDG Preparation",
      "Review",
      "Approval Package",
    ],
  },
};

export function checkPhaseCompletionRules(
  applicationId: string,
  phaseToValidate: PhaseName,
  applicationDates: ParsedApplicationDateInput[],
  applicationDocumentTypes: ApplicationPhaseDocumentTypeRecord,
  applicationPhases: ApplicationPhaseStatusRecord,
  applicationClearanceLevel: ClearanceLevel
): void {
  const validationChecks = VALIDATION_CHECKS[phaseToValidate];
  if (validationChecks === "No Validation") {
    return;
  }

  let datesToCheck = validationChecks.datesMustExist;
  let documentTypesToCheck = validationChecks.documentTypesMustExist;
  if (phaseToValidate === "Review") {
    if (applicationClearanceLevel === "CMS (OSORA)") {
      datesToCheck = [...datesToCheck, ...CMS_OSORA_CLEARANCE_DATE_TYPES];
    } else if (applicationClearanceLevel === "COMMs") {
      datesToCheck = [...datesToCheck, ...COMMS_CLEARANCE_DATE_TYPES];
    }
  }

  const applicationApprovalDate = applicationDates.find(
    (date) => date.dateType === "Application Approval Date"
  );

  if (
    !applicationApprovalDate ||
    applicationApprovalDate.dateValue.easternTZDate.valueOf() >= START_OF_2027_EASTERN.valueOf()
  ) {
    if (phaseToValidate === "Review") {
      datesToCheck = [...datesToCheck, "OACT Certification Date"];
    }
    if (phaseToValidate === "Approval Package") {
      documentTypesToCheck = [...documentTypesToCheck, "OACT Certification Memo"];
    }
  }

  checkPhaseStartedBeforeCompletion(
    applicationId,
    phaseToValidate,
    applicationPhases[phaseToValidate]
  );

  const applicationDateMap = makeApplicationDateMapFromList(applicationDates);
  const phasesToCheckComplete = validationChecks.phasesMustBeComplete;

  if (datesToCheck.length !== 0) {
    for (const dateToCheck of datesToCheck) {
      checkApplicationDateExistsForCompletion(
        applicationId,
        phaseToValidate,
        dateToCheck,
        applicationDateMap
      );
    }
  }

  if (documentTypesToCheck.length !== 0) {
    for (const documentTypeToCheck of documentTypesToCheck) {
      checkDocumentTypeExistsForCompletion(
        applicationId,
        phaseToValidate,
        documentTypeToCheck,
        applicationDocumentTypes
      );
    }
  }

  if (phasesToCheckComplete.length !== 0) {
    for (const phaseToCheckComplete of phasesToCheckComplete) {
      checkPriorPhaseCompleteForCompletion(
        applicationId,
        phaseToValidate,
        phaseToCheckComplete,
        applicationPhases
      );
    }
  }
}
