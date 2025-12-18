import {
  ApplicationWorkflowDemonstration,
  SimplePhase,
} from "components/application/ApplicationWorkflow";
import React from "react";
import { REVIEW_PHASE_DATE_TYPES, ReviewPhase, ReviewPhaseFormData } from "./ReviewPhase";
import { format } from "date-fns";

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
