import React from "react";
import { tw } from "tags/tw";
import { PhaseName } from "./PhaseSelector";
import { SuccessIcon } from "components/icons";
import { PhaseDate } from "./PhaseDate";
import { isCompletionStatus, PhaseStatus } from "./phaseStatus";

const BASE_STYLES = {
  PHASE_BOX: tw`flex flex-col items-center justify-center rounded-sm hover:cursor-pointer aspect-2/1 p-1`,
  PHASE_NUMBER: tw`flex items-center justify-center text-lg w-3 h-3 my-1 rounded-full font-bold`,
  PHASE_NAME: tw`text-md font-bold truncate max-w-full`,
};

const PHASE_STYLE_LOOKUP: Record<PhaseStatus, { box: string; number: string }> = {
  skipped: {
    box: tw`bg-white text-text-placeholder border border-brand`,
    number: tw`text-brand border border-brand`,
  },
  completed: {
    box: tw`bg-white text-text-placeholder border border-border-fields`,
    number: tw`text-brand border border-brand`,
  },
  in_progress: {
    box: tw`bg-white text-text-filled font-bold border border-brand`,
    number: tw`text-brand border border-brand`,
  },
  not_started: {
    box: tw`bg-surface-disabled2 text-text-placeholder border border-border-fields`,
    number: tw`text-icon-base border border-icon-base`,
  },
  past_due: {
    box: tw`bg-white text-text-warn font-bold border border-text-warn`,
    number: tw`text-text-warn border border-text-warn`,
  },
};

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
        className={
          `${BASE_STYLES.PHASE_BOX} 
          ${phaseStyles.box} 
          ${props.isSelectedPhase ? "scale-110" : ""}`
        }
        onClick={() => props.setPhaseAsSelected()}
      >
        <div className={`${BASE_STYLES.PHASE_NUMBER} ${phaseStyles.number}`}>
          {showSuccessIcon ? (
            <SuccessIcon className="w-full h-full" />
          ) : (
            props.phaseNumber
          )}
        </div>
        <span className={BASE_STYLES.PHASE_NAME}>{props.phaseName}</span>
      </div>
      <PhaseDate phaseStatus={props.phaseStatus} date={props.displayDate} />
    </div>
  );
};
