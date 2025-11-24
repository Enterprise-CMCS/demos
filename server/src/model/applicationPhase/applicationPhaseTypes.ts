import { ApplicationDate as PrismaApplicationDate } from "@prisma/client";
import { DateType, DocumentType, PhaseNameWithTrackedStatus, PhaseStatus } from "../../types.js";

export type ValidationChecks = {
  datesMustExist: DateType[];
  documentTypesMustExist: DocumentType[];
  phasesMustBeComplete: PhaseNameWithTrackedStatus[];
};

export type PhaseCompletionValidationChecksRecord = Record<
  PhaseNameWithTrackedStatus,
  ValidationChecks | "No Validation" | "Not Implemented"
>;

export type PhaseActions = {
  dateToComplete: DateType;
  nextPhase?: {
    phaseName: PhaseNameWithTrackedStatus;
    dateToStart?: DateType;
  };
};
export type PhaseActionRecord = Record<
  PhaseNameWithTrackedStatus,
  PhaseActions | "Not Implemented" | "Not Permitted"
>;

export type ApplicationPhaseStatusRecord = Record<PhaseNameWithTrackedStatus, PhaseStatus>;

export type ApplicationPhaseDocumentTypeRecord = Record<PhaseNameWithTrackedStatus, DocumentType[]>;

export type PrismaApplicationDateResults = Pick<
  PrismaApplicationDate,
  "dateTypeId" | "dateValue" | "createdAt" | "updatedAt"
>;
