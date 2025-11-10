import React from "react";
import type { PhaseStatus } from "./PhaseSelector";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const BASE_STYLES = tw`flex flex-col h-full items-center justify-center mt-1 text-md font-bold`;
const PAST_DUE_TEXT_CLASS = tw`text-text-warn text-[12px]`;

const PHASE_LABEL_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: "Skipped",
  Started: "Due",
  "Not Started": "Not Started",
  Completed: "Completed",
  Incomplete: "Incomplete",
  "past-due": "Past Due",
};

const PHASE_TEXT_COLOR_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: tw`italic text-text-placeholder text-[12px]`,
  Started: tw`italic text-brand text-[12px]`,
  "Not Started": tw`italic text-text-placeholder text-[12px]`,
  Completed: tw`italic text-text-placeholder text-[12px]`,
  Incomplete: tw`italic text-text-warn text-[12px]`,
  "past-due": tw`italic text-text-warn text-[12px]`,
};

const PHASE_DATE_STYLE_LOOKUP: Record<PhaseStatus, string> = {
  Skipped: tw`text-success-darkest text-[12px]`,
  Started: tw`text-brand text-[12px]`,
  "Not Started": tw`text-text-placeholder text-[12px]`,
  Completed: tw`text-success-darkest text-[12px]`,
  "past-due": PAST_DUE_TEXT_CLASS,
  Incomplete: PAST_DUE_TEXT_CLASS,
};

interface PhaseDateProps {
  phaseStatus: PhaseStatus;
  date?: Date;
}

export const PhaseDate: React.FC<PhaseDateProps> = ({ phaseStatus, date }) => {
  const label = PHASE_LABEL_LOOKUP[phaseStatus];
  const labelClass = PHASE_TEXT_COLOR_LOOKUP[phaseStatus];
  const dateClass = PHASE_DATE_STYLE_LOOKUP[phaseStatus];

  return (
    <div className={BASE_STYLES}>
      <span className={labelClass}>{label}</span>
      <span className={dateClass}>{date ? formatDate(date) : "--/--/----"}</span>
    </div>
  );
};
