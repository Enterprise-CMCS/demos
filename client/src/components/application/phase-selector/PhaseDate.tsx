import React from "react";
import { PhaseStatus } from "./PhaseSelector";
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

interface PhaseDateProps {
  phaseStatus: PhaseStatus;
  date?: Date;
  isPastDue?: boolean;
}

export const PhaseDate: React.FC<PhaseDateProps> = ({ phaseStatus, date, isPastDue }) => {
  const showPastDue = phaseStatus === "in_progress" && Boolean(isPastDue);
  const label = showPastDue ? "Past Due" : PHASE_DATE_TEXT_LOOKUP[phaseStatus];
  const labelClass = showPastDue ? PAST_DUE_TEXT_CLASS : PHASE_TEXT_COLOR_LOOKUP[phaseStatus];
  const dateClass = showPastDue ? PAST_DUE_DATE_CLASS : PHASE_DATE_STYLE_LOOKUP[phaseStatus];

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
