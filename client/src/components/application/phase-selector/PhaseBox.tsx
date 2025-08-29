import React from "react";
import { tw } from "tags/tw";
import { PhaseName, PhaseStatus } from "./PhaseSelector";
import { SuccessIcon } from "components/icons";
import { PhaseDate } from "./PhaseDate";

const BASE_STYLES = {
  PHASE_BOX: tw`flex flex-col items-center justify-center rounded-sm hover:cursor-pointer aspect-2/1`,
  PHASE_NUMBER: tw`flex items-center justify-center text-lg w-3 h-3 my-1 rounded-full font-bold`,
  PHASE_NAME: tw`text-md font-bold truncate`,
};

const PHASE_NUMBER_COLORS: Record<PhaseStatus, string> = {
  skipped: tw`text-brand border border-brand`,
  in_progress: tw`text-brand border border-brand`,
  not_started: tw`text-icon-base border border-icon-base`,
  completed: tw``, // Curently, an icon is rendered instead
};

const PHASE_BOX_COLORS: Record<PhaseStatus, string> = {
  skipped: tw`bg-white text-text-filled border border-brand`,
  in_progress: tw`bg-white text-text-filled font-bold border border-brand`,
  not_started: tw`bg-surface-disabled2 text-text-placeholder border border-border-fields`,
  completed: tw`bg-white text-text-placeholder border border-border-fields`,
};

interface PhaseBoxProps {
  phaseName: PhaseName;
  phaseNumber: number;
  phaseStatus: PhaseStatus;
  setSelectedPhase: (phase: PhaseName) => void;
}

export const PhaseBox = (props: PhaseBoxProps) => {
  return (
    <div className="flex flex-col justify-center col-span-1">
      <div
        key={props.phaseName}
        className={`${BASE_STYLES.PHASE_BOX} ${PHASE_BOX_COLORS[props.phaseStatus]}`}
        onClick={() => props.setSelectedPhase(props.phaseName)}
      >
        <div className={`${BASE_STYLES.PHASE_NUMBER} ${PHASE_NUMBER_COLORS[props.phaseStatus]}}`}>
          {props.phaseStatus === "completed" ? (
            <SuccessIcon className="w-full h-full" />
          ) : (
            props.phaseNumber
          )}
        </div>
        <span className={BASE_STYLES.PHASE_NAME}>{props.phaseName}</span>
        {props.phaseStatus === "skipped" && <span className="text-brand font-bold">Skipped</span>}
      </div>
      <PhaseDate phaseStatus={props.phaseStatus} />
    </div>
  );
};
