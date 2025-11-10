import React from "react";
import { tw } from "tags/tw";
import type { PhaseName, PhaseStatus } from "./PhaseSelector";
import { SuccessIcon } from "components/icons";
import { PhaseDate } from "./PhaseDate";

const BASE_STYLES = {
  PHASE_BOX: tw`flex flex-col items-center justify-center rounded-sm hover:cursor-pointer aspect-2/1 p-1`,
  PHASE_NUMBER: tw`flex items-center justify-center text-lg w-3 h-3 my-1 rounded-full font-bold`,
  PHASE_NAME: tw`text-[12px] font-bold truncate max-w-full`,
};

const PHASE_STYLE_LOOKUP: Record<PhaseStatus, { box: string; number: string }> = {
  Skipped: {
    box: tw`bg-white text-text-placeholder border border-brand`,
    number: tw``,
  },
  Completed: {
    box: tw`bg-white text-text-placeholder border border-border-fields`,
    number: tw``,
  },
  Started: {
    box: tw`bg-white text-text-filled font-bold border border-brand`,
    number: tw`text-brand border border-brand`,
  },
  "Not Started": {
    box: tw`bg-[#ecf0f5] text-text-placeholder border border-border-fields`,
    number: tw`text-icon-base border border-icon-base`,
  },
  "past-due": {
    box: tw`bg-white text-text-warn font-bold border border-text-warn`,
    number: tw`text-text-warn border border-text-warn`,
  },
  Incomplete: {
    box: tw`bg-white text-text-warn font-bold border border-text-warn`,
    number: tw`text-text-warn border border-text-warn`,
  },
};

const isCompletionStatus = (status: PhaseStatus): boolean =>
  status === "Completed" || status === "Skipped";

interface PhaseBoxProps {
  phaseName: PhaseName;
  phaseNumber: number;
  phaseStatus: PhaseStatus;
  displayDate?: Date;
  isSelectedPhase: boolean;
  setPhaseAsSelected: () => void;
}

export const PhaseBox = (props: PhaseBoxProps) => {
  const phaseStyles = PHASE_STYLE_LOOKUP[props.phaseStatus];
  const showSuccessIcon = isCompletionStatus(props.phaseStatus);

  return (
    <div className="flex flex-col justify-center col-span-1">
      <div
        key={props.phaseName}
        className={`${BASE_STYLES.PHASE_BOX} 
          ${phaseStyles.box} 
          ${props.isSelectedPhase ? "scale-110" : ""}`}
        onClick={() => props.setPhaseAsSelected()}
      >
        <div className={`${BASE_STYLES.PHASE_NUMBER} ${phaseStyles.number}`}>
          {showSuccessIcon ? <SuccessIcon className="w-full h-full" /> : props.phaseNumber}
        </div>
        <span className={BASE_STYLES.PHASE_NAME}>{props.phaseName}</span>
      </div>
      <PhaseDate phaseStatus={props.phaseStatus} date={props.displayDate} />
    </div>
  );
};
