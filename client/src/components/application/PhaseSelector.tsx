import React, { useState } from "react";

const PHASE_NAMES = [
  "Concept",
  "State Application",
  "Completeness",
  "Federal Comment",
  "SME/FRT",
  "OGC & OMB",
  "Approval Package",
  "Post Approval",
] as const;

export type PhaseName = (typeof PHASE_NAMES)[number];

const STYLES = {
  PHASE_BOX:
    "p-2 flex flex-col items-center justify-center bg-gray-100 border border-gray-300 rounded-sm",
  PHASE_NUMBER:
    "border border-text-placeholder flex items-center justify-center w-3 h-3 my-1 rounded-full text-text-placeholder font-bold",
  PHASE_NAME: "text-md whitespace-nowrap font-bold text-text-placeholder",
  VERTICAL_RULE: "h-20 w-0.5 bg-surface-placeholder mx-1",
};

const VerticalRule = () => <div className={STYLES.VERTICAL_RULE} aria-hidden="true" />;

interface PhaseBoxProps {
  phaseName: PhaseName;
  phaseNumber: number;
  setSelectedPhase: (phase: PhaseName) => void;
}
const PhaseBox = (props: PhaseBoxProps) => {
  return (
    <div
      key={props.phaseName}
      className={STYLES.PHASE_BOX}
      onClick={() => props.setSelectedPhase(props.phaseName)}
    >
      <span className={STYLES.PHASE_NUMBER}>{props.phaseNumber}</span>
      <span className={STYLES.PHASE_NAME}>{props.phaseName}</span>
    </div>
  );
};

const PhaseGroups = () => {
  return (
    <div className="grid grid-cols-8">
      <span className="col-span-1">Pre-Submission</span>
      <span className="col-span-3">Submission</span>
      <span className="col-span-3">Approval</span>
      <span className="col-span-1">Post-Approval</span>
    </div>
  );
};

interface PhaseSelectorProps {
  initialPhase?: PhaseName;
}
export const PhaseSelector = (props: PhaseSelectorProps) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(props.initialPhase ?? "Concept");

  return (
    <>
      <PhaseGroups />
      <div className="flex items-center w-full gap-1">
        {PHASE_NAMES.map((phaseName, idx) => (
          <React.Fragment key={phaseName}>
            <PhaseBox
              phaseName={phaseName}
              phaseNumber={idx + 1}
              setSelectedPhase={setSelectedPhase}
            />
            {[0, 3, 6].includes(idx) && idx !== PHASE_NAMES.length - 1 && <VerticalRule />}
          </React.Fragment>
        ))}
      </div>
      <DisplayPhase selectedPhase={selectedPhase} />
    </>
  );
};

export const DisplayPhase = ({ selectedPhase }: { selectedPhase: PhaseName }) => {
  return <div className="border border-border-rules w-full h-full min-h-64">{selectedPhase}</div>;
};
