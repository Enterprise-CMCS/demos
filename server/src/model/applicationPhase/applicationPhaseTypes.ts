import {
  ApplicationDate as PrismaApplicationDate,
  ApplicationNote as PrismaApplicationNote,
} from "@prisma/client";
import { DateType, DocumentType, PhaseName, PhaseStatus } from "../../types.js";

export type ValidationChecks = {
  datesMustExist: DateType[];
  documentTypesMustExist: DocumentType[];
  phasesMustBeComplete: PhaseName[];
};

export type PhaseCompletionValidationChecksRecord = Record<
  PhaseName,
  ValidationChecks | "No Validation"
>;

export type PhaseActions = {
  dateToComplete: DateType;
  nextPhase?: {
    phaseName: PhaseName;
    dateToStart?: DateType;
  };
};
export type PhaseActionRecord = Record<PhaseName, PhaseActions | "Not Permitted">;

export type ApplicationPhaseStatusRecord = Record<PhaseName, PhaseStatus>;

export type ApplicationPhaseDocumentTypeRecord = Record<PhaseName, DocumentType[]>;

export type PrismaApplicationDateResults = Pick<
  PrismaApplicationDate,
  "dateTypeId" | "dateValue" | "createdAt" | "updatedAt"
>;

export type PrismaApplicationNoteResults = Pick<
  PrismaApplicationNote,
  "noteTypeId" | "content" | "createdAt" | "updatedAt"
>;
