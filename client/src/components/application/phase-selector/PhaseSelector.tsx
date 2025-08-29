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
} from "../phases";
import { PhaseBox } from "./PhaseBox";

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

export type PhaseStatus = "skipped" | "not_started" | "in_progress" | "completed";

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

// TODO: REMOVE - JUST FOR TESTING!
const MOCK_PHASE_STATUSES: PhaseStatusLookup = {
  Concept: "skipped",
  "State Application": "completed",
  Completeness: "in_progress",
  "Federal Comment": "not_started",
  "SME/FRT": "not_started",
  "OGC & OMB": "not_started",
  "Approval Package": "not_started",
  "Post Approval": "not_started",
};

type PhaseStatusLookup = Record<PhaseName, PhaseStatus>;
interface PhaseSelectorProps {
  initialPhase?: PhaseName;
  phaseStatusLookup?: PhaseStatusLookup;
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
            phaseStatus={MOCK_PHASE_STATUSES[phaseName]}
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
    <div className="border border-dashed w-full h-full min-h-64">
      <PhaseComponent />
    </div>
  );
};
