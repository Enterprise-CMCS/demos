import React from "react";
import { PhaseStatus } from "./phaseStatus";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const BASE_STYLES = tw`flex flex-col h-full items-center justify-center mt-1 text-md font-bold`;
const PAST_DUE_TEXT_CLASS = tw`text-text-warn`;
const PAST_DUE_DATE_CLASS = tw`italic text-text-warn`;

const PHASE_DATE_TEXT_LOOKUP: Record<PhaseStatus, string> = {
  skipped: "Skipped",
  in_progress: "Due",
  not_started: "Not Started",
  completed: "Completed",
  past_due: "Past Due",
};

const PHASE_DATE_STYLE_LOOKUP: Record<PhaseStatus, string> = {
  skipped: tw`italic text-text-placeholder`,
  in_progress: tw`italic text-brand`,
  not_started: tw`italic text-text-placeholder`,
  completed: tw`italic text-text-placeholder`,
  past_due: PAST_DUE_DATE_CLASS,
};

const PHASE_TEXT_COLOR_LOOKUP: Record<PhaseStatus, string> = {
  skipped: tw`text-success-darkest`,
  in_progress: tw`text-brand`,
  not_started: tw`text-text-placeholder`,
  completed: tw`text-success-darkest`,
  past_due: PAST_DUE_TEXT_CLASS,
};

interface PhaseDateProps {
  phaseStatus: PhaseStatus;
  date?: Date;
}

export const PhaseDate: React.FC<PhaseDateProps> = ({ phaseStatus, date }) => {
  const label = PHASE_DATE_TEXT_LOOKUP[phaseStatus];
  const labelClass = PHASE_TEXT_COLOR_LOOKUP[phaseStatus];
  const dateClass = PHASE_DATE_STYLE_LOOKUP[phaseStatus];

  return (
    <div className={BASE_STYLES}>
      <span className={labelClass}>
        {label}
      </span>
      <span className={dateClass}>
        {date ? formatDate(date) : "--/--/----"}
      </span>
    </div>
  );
};
