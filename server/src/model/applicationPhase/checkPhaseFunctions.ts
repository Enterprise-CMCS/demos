import { DateType, PhaseNameWithTrackedStatus, PhaseStatus, DocumentType } from "../../types.js";
import { ApplicationDateMap } from "../applicationDate";
import { ApplicationPhaseDocumentTypeRecord, ApplicationPhaseStatusRecord } from ".";

export function checkPhaseStatus(
  actualPhaseStatus: PhaseStatus,
  expectedPhaseStatus: PhaseStatus,
  errorMsg: string
): void {
  if (actualPhaseStatus !== expectedPhaseStatus) {
    throw new Error(errorMsg);
  }
}

export function checkPhaseStartedBeforeCompletion(
  applicationId: string,
  phaseToValidate: PhaseNameWithTrackedStatus,
  currentPhaseStatus: PhaseStatus
): void {
  checkPhaseStatus(
    currentPhaseStatus,
    "Started",
    `${phaseToValidate} phase for application ${applicationId} ` +
      `has status ${currentPhaseStatus}; cannot complete ` +
      `a phase unless it has status of Started.`
  );
}

export function checkConceptPhaseStartedBeforeSkipping(
  applicationId: string,
  currentPhaseStatus: PhaseStatus
): void {
  checkPhaseStatus(
    currentPhaseStatus,
    "Started",
    `Concept phase for application ${applicationId} ` +
      `has status ${currentPhaseStatus}; cannot skip the phase ` +
      `unless it has status of Started.`
  );
}

export function checkCompletenessStatusForIncomplete(
  applicationId: string,
  currentPhaseStatus: PhaseStatus
): void {
  checkPhaseStatus(
    currentPhaseStatus,
    "Started",
    `Completeness phase for application ${applicationId} ` +
      `has status ${currentPhaseStatus}; cannot declare the Completeness phase ` +
      `Incomplete unless Completeness has the status of Started.`
  );
}

export function checkApplicationIntakeStatusForIncomplete(
  applicationId: string,
  currentPhaseStatus: PhaseStatus
): void {
  checkPhaseStatus(
    currentPhaseStatus,
    "Completed",
    `Application Intake phase for application ${applicationId} ` +
      `has status ${currentPhaseStatus}; cannot declare the Completeness phase ` +
      `Incomplete unless Application Intake has the status of Completed.`
  );
}

export function checkApplicationDateExistsForCompletion(
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

export function checkDocumentTypeExistsForCompletion(
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

export function checkPriorPhaseCompleteForCompletion(
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
