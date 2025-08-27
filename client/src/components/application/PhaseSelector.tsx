import React, { useState } from "react";
import {
  ConceptPhase,
  StateApplicationPhase,
  CompletenessPhase,
  FederalCommentPhase,
  SmeFrtPhase,
  OgcOmbPhase,
  ApprovalPackagePhase,
  PostApprovalPhase,
} from "./phases";

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

type PhaseStatus = "skipped" | "not_started" | "in_progress" | "completed";
type PhaseStatusLookup = Record<PhaseName, PhaseStatus>;

const PHASE_COMPONENTS_LOOKUP: Record<PhaseName, React.ComponentType> = {
  Concept: ConceptPhase,
  "State Application": StateApplicationPhase,
  Completeness: CompletenessPhase,
  "Federal Comment": FederalCommentPhase,
  "SME/FRT": SmeFrtPhase,
  "OGC & OMB": OgcOmbPhase,
  "Approval Package": ApprovalPackagePhase,
  "Post Approval": PostApprovalPhase,
};

const PHASE_BOX_COLORS: Record<PhaseStatus, string> = {
  skipped: "bg-white text-text-filled border border-brand",
  not_started: "bg-surface-disabled2 text-text-placeholder border border-border-fields",
  in_progress: "bg-white text-text-filled font-bold border border-brand",
  completed: "bg-white text-text-placeholder border border-border-fields",
};

const STYLES = {
  PHASE_BOX: "flex flex-col items-center justify-center rounded-sm hover:cursor-pointer",
  PHASE_NUMBER:
    "border border-text-placeholder flex items-center justify-center w-3 h-3 my-1 rounded-full text-text-placeholder font-bold",
  PHASE_NAME: "text-md whitespace-nowrap font-bold",
};

interface PhaseBoxProps {
  phaseName: PhaseName;
  phaseNumber: number;
  phaseStatus: PhaseStatus;
  setSelectedPhase: (phase: PhaseName) => void;
}

const PhaseBox = (props: PhaseBoxProps) => {
  return (
    <div className="col-span-1">
      <div
        key={props.phaseName}
        className={`${STYLES.PHASE_BOX} ${PHASE_BOX_COLORS[props.phaseStatus]}`}
        onClick={() => props.setSelectedPhase(props.phaseName)}
      >
        <span className={STYLES.PHASE_NUMBER}>{props.phaseNumber}</span>
        <span className={STYLES.PHASE_NAME}>{props.phaseName}</span>
        {props.phaseStatus === "skipped" && <span className="text-brand font-bold">Skipped</span>}
      </div>
    </div>
  );
};

const PhaseGroups = () => {
  return (
    <>
      <span className="col-span-1">Pre-Submission</span>
      <span className="col-span-3">Submission</span>
      <span className="col-span-3">Approval</span>
      <span className="col-span-1">Post-Approval</span>
    </>
  );
};

// TODO: REMOVE!
const PHASE_STATUSES: PhaseStatusLookup = {
  Concept: "skipped",
  "State Application": "completed",
  Completeness: "in_progress",
  "Federal Comment": "not_started",
  "SME/FRT": "not_started",
  "OGC & OMB": "not_started",
  "Approval Package": "not_started",
  "Post Approval": "not_started",
};

interface PhaseSelectorProps {
  initialPhase?: PhaseName;
  phaseStatuses?: PhaseStatusLookup;
}
export const PhaseSelector = (props: PhaseSelectorProps) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(props.initialPhase ?? "Concept");

  return (
    <>
      <div className="grid grid-cols-8 gap-sm">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, idx) => (
          <PhaseBox
            key={phaseName}
            phaseName={phaseName}
            phaseStatus={PHASE_STATUSES[phaseName]}
            phaseNumber={idx + 1}
            setSelectedPhase={setSelectedPhase}
          />
        ))}
      </div>
      <DisplayPhase selectedPhase={selectedPhase} />
    </>
  );
};

export const DisplayPhase = ({ selectedPhase }: { selectedPhase: PhaseName }) => {
  const PhaseComponent = PHASE_COMPONENTS_LOOKUP[selectedPhase];

  return (
    <div className="border border-border-rules w-full h-full min-h-64">
      <PhaseComponent />
    </div>
  );
};
