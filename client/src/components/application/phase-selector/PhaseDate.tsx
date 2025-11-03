import React from "react";
import type { PhaseStatus } from "./PhaseSelector";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const BASE_STYLES = tw`flex flex-col h-full items-center justify-center mt-1 text-md font-bold`;
const PAST_DUE_TEXT_CLASS = tw`text-text-warn text-xs-12`;
const PAST_DUE_DATE_CLASS = tw`italic text-text-warn text-xs-12`;

const PHASE_DATE_TEXT_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: "Skipped",
  Started: "Due",
  "Not Started": "Not Started",
  Completed: "Completed",
  Incomplete: "Incomplete",
  "past-due": "Past Due",
};

const PHASE_DATE_STYLE_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: tw`italic text-text-placeholder text-xs-12`,
  Started: tw`italic text-brand text-xs-12`,
  "Not Started": tw`italic text-text-placeholder text-xs-12`,
  Completed: tw`italic text-text-placeholder text-xs-12`,
  "past-due": PAST_DUE_DATE_CLASS,
  Incomplete: PAST_DUE_DATE_CLASS,
};

const PHASE_TEXT_COLOR_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: tw`text-success-darkest text-xs-12`,
  Started: tw`text-brand text-xs-12`,
  "Not Started": tw`text-text-placeholder text-xs-12`,
  Completed: tw`text-success-darkest text-xs-12`,
  "past-due": PAST_DUE_TEXT_CLASS,
  Incomplete: PAST_DUE_TEXT_CLASS,
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
      <span className={labelClass}>{label}</span>
      <span className={dateClass}>{date ? formatDate(date) : "--/--/----"}</span>
    </div>
  );
};
