import React from "react";
import { PhaseStatus } from "./PhaseSelector";
import { formatDate } from "util/formatDate";
import { tw } from "tags/tw";

const BASE_STYLES = tw`flex flex-col items-center justify-center mt-1 text-md font-bold`;

const PHASE_DATE_TEXT_LOOKUP: Record<PhaseStatus, string> = {
  skipped: "Skipped",
  in_progress: "Due",
  not_started: "Not Started",
  completed: "Completed",
};

const PHASE_COLOR_LOOKUP: Record<PhaseStatus, string> = {
  skipped: tw`text-brand`,
  in_progress: tw`text-brand`,
  not_started: tw`text-text-placeholder`,
  completed: tw`text-success`,
};

export const PhaseDate = ({ phaseStatus, date }: { phaseStatus: PhaseStatus; date?: Date }) => {
  return (
    <div className={`${BASE_STYLES} ${PHASE_COLOR_LOOKUP[phaseStatus]}`}>
      <span>{PHASE_DATE_TEXT_LOOKUP[phaseStatus]}</span>
      <br></br>
      <span>{date ? formatDate(date) : "--/--/----"}</span>
    </div>
  );
};
