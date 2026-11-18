import { PhaseActionRecord } from ".";
import { PhaseName } from "../../constants.js";
import { ApplicationActionType } from "../../types";

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

export const PHASE_ACTION_TYPE_MAPPING = {
  Concept: {
    start: "Started Concept Phase",
    complete: "Completed Concept Phase",
    skip: "Skipped Concept Phase",
  },
  "Application Intake": {
    start: "Started Application Intake Phase",
    complete: "Completed Application Intake Phase",
  },
  Completeness: {
    start: "Started Completeness Phase",
    complete: "Completed Completeness Phase",
    declareIncomplete: "Declared Completeness Phase Incomplete",
  },
  "SDG Preparation": {
    start: "Started SDG Preparation Phase",
    complete: "Completed SDG Preparation Phase",
  },
  Review: {
    start: "Started Review Phase",
    complete: "Completed Review Phase",
  },
  "Approval Package": {
    start: "Started Approval Package Phase",
    complete: "Completed Approval Package Phase",
  },
  "Approval Summary": {
    start: "Started Approval Summary Phase",
    complete: "Completed Approval Summary Phase",
  },
} as const satisfies Record<
  Exclude<PhaseName, "Federal Comment">,
  Record<string, ApplicationActionType>
>;
