import type { PhaseStatus as ServerPhaseStatus } from "demos-server";

export const BASE_PHASE_STATUSES = ["skipped", "not_started", "in_progress", "completed"] as const;
export type BasePhaseStatus = (typeof BASE_PHASE_STATUSES)[number];

export const EXTRA_PHASE_STATUSES = ["past_due"] as const;
export type ExtendedPhaseStatus = (typeof EXTRA_PHASE_STATUSES)[number];

export type PhaseStatus = BasePhaseStatus | ExtendedPhaseStatus;

const SERVER_TO_BASE_STATUS: Record<ServerPhaseStatus, BasePhaseStatus> = {
  Skipped: "skipped",
  "Not Started": "not_started",
  Started: "in_progress",
  Completed: "completed",
};

const BASE_TO_SERVER_STATUS: Record<BasePhaseStatus, ServerPhaseStatus> = {
  skipped: "Skipped",
  not_started: "Not Started",
  in_progress: "Started",
  completed: "Completed",
};

export const toBasePhaseStatus = (status: ServerPhaseStatus): BasePhaseStatus => {
  return SERVER_TO_BASE_STATUS[status];
};

export const toServerPhaseStatus = (status: BasePhaseStatus): ServerPhaseStatus => {
  return BASE_TO_SERVER_STATUS[status];
};

export const getDisplayPhaseStatus = (
  status: BasePhaseStatus,
  options?: { isPastDue?: boolean }
): PhaseStatus => {
  if (status === "in_progress" && options?.isPastDue) {
    return "past_due";
  }
  return status;
};

export const isCompletionStatus = (status: PhaseStatus): boolean => {
  return status === "completed" || status === "skipped";
};
