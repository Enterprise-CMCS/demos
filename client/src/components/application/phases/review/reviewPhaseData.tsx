import {
  ApplicationWorkflowDemonstration,
  SimplePhase,
} from "components/application/ApplicationWorkflow";
import React from "react";
import { ReviewPhase, ReviewPhaseFormData } from "./ReviewPhase";
import { format } from "date-fns";
import { REVIEW_PHASE_DATE_TYPES, REVIEW_PHASE_NOTE_TYPES } from "demos-server-constants";
import { ApplicationDateInput, ApplicationNoteInput, LocalDate } from "demos-server";

export function getFormDataFromPhase(reviewPhase: SimplePhase): ReviewPhaseFormData {
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

  // TODO: MOCKING NOTES AND CLEARANCE LEVEL UNTIL BACKEND SUPPORTS IT.
  //  - notes integration - DEMOS-1266
  //  - notes backend support - DEMOS-1167
  //  - clearance level integration - DEMOS-1224
  // WILL LIKELY END UP LOOKING LIKE THIS:
  // for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
  //   const note = reviewPhase.phaseNotes.find((n) => n.noteType === noteType);
  //   if (note) formData.notes[noteType] = note.content;
  // }
  // formData.clearanceLevel = reviewPhase.clearanceLevel;

  formData.notes = {
    "PO and OGD": "Mock PO and OGD Note content",
    "CMS (OSORA) Clearance": "Mock CMS (OSORA) Clearance Note content",
  };

  formData.clearanceLevel = "CMS (OSORA)";

  return formData;
}

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
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
