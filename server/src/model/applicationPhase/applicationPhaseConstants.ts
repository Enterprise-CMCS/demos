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
      phaseName: "OGC & OMB Review",
      dateToStart: "OGC & OMB Review Start Date",
    },
  },
  "OGC & OMB Review": {
    dateToComplete: "OGC & OMB Review Completion Date",
    nextPhase: {
      phaseName: "Approval Package",
      dateToStart: "Approval Package Start Date",
    },
  },
  "Approval Package": {
    dateToComplete: "Approval Package Completion Date",
    nextPhase: {
      phaseName: "Post Approval",
    },
  },
  "Post Approval": "Not Implemented",
};
