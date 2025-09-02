import React from "react";
import { PhaseStatus } from "./PhaseSelector";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const BASE_STYLES = tw`flex flex-col h-full items-center justify-center mt-1 text-md font-bold`;

const PHASE_DATE_TEXT_LOOKUP: Record<PhaseStatus, string> = {
  skipped: "Skipped",
  in_progress: "Due",
  not_started: "Not Started",
  completed: "Completed",
};

const PHASE_DATE_STYLE_LOOKUP: Record<PhaseStatus, string> = {
  skipped: tw`italic text-text-placeholder`,
  in_progress: tw`italic text-brand`,
  not_started: tw`italic text-text-placeholder`,
  completed: tw`italic text-text-placeholder`,
};

const PHASE_TEXT_COLOR_LOOKUP: Record<PhaseStatus, string> = {
  skipped: tw`text-success-darkest`,
  in_progress: tw`text-brand`,
  not_started: tw`text-text-placeholder`,
  completed: tw`text-success-darkest`,
};

export const PhaseDate = ({ phaseStatus, date }: { phaseStatus: PhaseStatus; date?: Date }) => {
  return (
    <div className={BASE_STYLES}>
      <span className={PHASE_TEXT_COLOR_LOOKUP[phaseStatus]}>
        {PHASE_DATE_TEXT_LOOKUP[phaseStatus]}
      </span>
      <span className={PHASE_DATE_STYLE_LOOKUP[phaseStatus]}>{formatDate(date)}</span>
    </div>
  );
};
