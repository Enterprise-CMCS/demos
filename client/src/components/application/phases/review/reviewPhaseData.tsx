import {
  ApplicationWorkflowDemonstration,
  SimplePhase,
} from "components/application/ApplicationWorkflow";
import React from "react";
import { ReviewPhase, ReviewPhaseFormData } from "./ReviewPhase";
import { format } from "date-fns";
import { REVIEW_PHASE_DATE_TYPES, REVIEW_PHASE_NOTE_TYPES } from "demos-server-constants";
import { ApplicationDateInput, ApplicationNoteInput, LocalDate } from "demos-server";

export type ReviewPhaseDemonstration = Pick<
  ApplicationWorkflowDemonstration,
  "id" | "clearanceLevel" | "phases"
>;
export function getPhaseData(
  reviewPhase: SimplePhase
): Omit<ReviewPhaseFormData, "clearanceLevel"> {
  const formData: Omit<ReviewPhaseFormData, "clearanceLevel"> = { dates: {}, notes: {} };

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

  return formData;
}

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ReviewPhaseDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData: ReviewPhaseFormData = {
    ...getPhaseData(reviewPhase),
    clearanceLevel: demonstration.clearanceLevel,
  };
  return (
    <ReviewPhase
      isReadonly={reviewPhase.phaseStatus === "Completed"}
      initialFormData={reviewPhaseFormData}
      demonstrationId={demonstration.id}
    />
  );
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
