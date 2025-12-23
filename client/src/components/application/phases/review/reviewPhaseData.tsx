import {
  ApplicationWorkflowDemonstration,
  SimplePhase,
} from "components/application/ApplicationWorkflow";
import React from "react";
import { ReviewPhase, ReviewPhaseFormData } from "./ReviewPhase";
import { format } from "date-fns";
import { REVIEW_PHASE_DATE_TYPES, REVIEW_PHASE_NOTE_TYPES } from "demos-server-constants";
import { ApplicationDateInput, ApplicationNoteInput, LocalDate } from "demos-server";

export type ReviewPhase = Pick<SimplePhase, "phaseName" | "phaseDates" | "phaseNotes">;
export type ReviewPhaseDemonstration = Pick<ApplicationWorkflowDemonstration, "id"> & {
  phases: ReviewPhase[];
};
export function getFormDataFromPhase(reviewPhase: ReviewPhase): ReviewPhaseFormData {
  const formData: ReviewPhaseFormData = {
    dates: {},
    notes: {},
    clearanceLevel: "CMS (OSORA)",
  };

  for (const dateType of REVIEW_PHASE_DATE_TYPES) {
    const date = reviewPhase.phaseDates.find((d) => d.dateType === dateType);
    if (date) {
      formData.dates[dateType] = format(new Date(date.dateValue), "yyyy-MM-dd");
    }
  }

  for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
    const note = reviewPhase.phaseNotes.find((n) => n.noteType === noteType);
    if (note) formData.notes[noteType] = note.content;
  }

  // TODO: MOCKING CLEARANCE LEVEL UNTIL BACKEND SUPPORTS IT.
  //  - clearance level integration - DEMOS-1224
  // WILL LIKELY END UP LOOKING LIKE THIS:
  // formData.clearanceLevel = reviewPhase.clearanceLevel;
  formData.clearanceLevel = "CMS (OSORA)";

  return formData;
}

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ReviewPhaseDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase initialFormData={reviewPhaseFormData} demonstrationId={demonstration.id} />;
};

export const formatDataForSave = (reviewPhaseFormData: ReviewPhaseFormData) => {
  const dates: ApplicationDateInput[] = [];
  for (const dateType of REVIEW_PHASE_DATE_TYPES) {
    const dateValue = reviewPhaseFormData.dates[dateType];
    if (dateValue) {
      dates.push({
        dateType: dateType,
        dateValue: dateValue as LocalDate,
      });
    }
  }

  const notes: ApplicationNoteInput[] = [];
  for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
    const noteContent = reviewPhaseFormData.notes[noteType];
    if (noteContent) {
      notes.push({
        noteType: noteType,
        content: noteContent,
      });
    }
  }

  return { dates, notes };
};

export function hasFormChanges(
  originalFormData: ReviewPhaseFormData,
  activeFormData: ReviewPhaseFormData
): boolean {
  for (const dateType of REVIEW_PHASE_DATE_TYPES) {
    if (originalFormData.dates[dateType] !== activeFormData.dates[dateType]) {
      return true;
    }
  }
  for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
    if (originalFormData.notes[noteType] !== activeFormData.notes[noteType]) {
      return true;
    }
  }
  if (originalFormData.clearanceLevel !== activeFormData.clearanceLevel) {
    return true;
  }
  return false;
}
