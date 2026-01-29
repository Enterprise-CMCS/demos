import { PhaseActionRecord } from ".";

export const PHASE_ACTIONS: PhaseActionRecord = {
  Concept: {
    dateToComplete: "Concept Completion Date",
    nextPhase: {
      phaseName: "Application Intake",
      dateToStart: "Application Intake Start Date",
    },
  },
  "Application Intake": {
    dateToComplete: "Application Intake Completion Date",
    nextPhase: {
      phaseName: "Completeness",
      dateToStart: "Completeness Start Date",
    },
  },
  Completeness: {
    dateToComplete: "Completeness Completion Date",
  },
  "Federal Comment": "Not Permitted",
  "SDG Preparation": {
    dateToComplete: "SDG Preparation Completion Date",
    nextPhase: {
      phaseName: "Review",
      dateToStart: "Review Start Date",
    },
  },
  Review: {
    dateToComplete: "Review Completion Date",
    nextPhase: {
      phaseName: "Approval Package",
      dateToStart: "Approval Package Start Date",
    },
  },
  "Approval Package": {
    dateToComplete: "Approval Package Completion Date",
    nextPhase: {
      phaseName: "Approval Summary",
      dateToStart: "Approval Summary Start Date",
    },
  },
  "Approval Summary": {
    dateToComplete: "Approval Summary Completion Date",
  },
};
