import { DateType, PhaseNameWithTrackedStatus, PhaseStatus, DocumentType } from "../../types.js";
import { ApplicationDateMap } from "../applicationDate";
import { ApplicationPhaseDocumentTypeRecord, ApplicationPhaseStatusRecord } from ".";

export function checkPhaseStartedBeforeCompletion(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  currentPhaseStatus: PhaseStatus
): void {
  if (currentPhaseStatus !== "Started") {
    throw new Error(
      `${phaseToValidate} phase for application ${applicationId} ` +
        `has status ${currentPhaseStatus}; cannot complete a phase unless it has status of Started.`
    );
  }
}

export function checkApplicationDateExists(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  dateToCheck: DateType,
  applicationDates: ApplicationDateMap
): void {
  const check = applicationDates.get(dateToCheck);
  if (!check) {
    throw new Error(
      `${phaseToValidate} phase for application ${applicationId} requires the date ${dateToCheck} to exist ` +
        "before phase completion, but it does not."
    );
  }
}

export function checkDocumentTypeExists(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  documentTypeToCheck: DocumentType,
  applicationDocumentTypes: ApplicationPhaseDocumentTypeRecord
): void {
  const check = applicationDocumentTypes[phaseToValidate].includes(documentTypeToCheck);
  if (!check) {
    throw new Error(
      `${phaseToValidate} phase for application ${applicationId} requires at least one document of type ` +
        `${documentTypeToCheck} to exist, but none do.`
    );
  }
}

export function checkPhaseComplete(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  phaseToCheckComplete: PhaseNameWithTrackedStatus,
  applicationPhases: ApplicationPhaseStatusRecord
): void {
  const actualPhaseStatus = applicationPhases[phaseToCheckComplete];
  const check = actualPhaseStatus === "Completed";
  if (!check) {
    throw new Error(
      `${phaseToValidate} phase for application ${applicationId} requires the phase ${phaseToCheckComplete} ` +
        `to be status Completed, but it is ${actualPhaseStatus}.`
    );
  }
}
