import React, { useCallback, useMemo, useState } from "react";

import {
  ApprovalPackagePhase,
  CompletenessPhase,
  ConceptPhase,
  FederalCommentPhase,
  OgcOmbPhase,
  PostApprovalPhase,
  SmeFrtPhase,
  StateApplicationPhase,
} from "../phases";
import { PhaseBox } from "./PhaseBox";
import { PhaseStatusContext } from "./PhaseStatusContext";

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
  const leftBorderStyles = "border-l-1 border-surface-placeholder pl-2 -ml-sm";
  return (
    <>
      <span className="col-span-1">Pre-Submission</span>
      <span className={`col-span-3 ${leftBorderStyles}`}>Submission</span>
      <span className={`col-span-3 ${leftBorderStyles}`}>Approval</span>
      <span className={`col-span-1 ${leftBorderStyles}`}>Post-Approval</span>
    </>
  );
};

const DisplayPhase = ({ selectedPhase }: { selectedPhase: PhaseName }) => {
  const PhaseComponent = PHASE_COMPONENTS_LOOKUP[selectedPhase];

  return (
    <div className="w-full h-full min-h-64">
      <PhaseComponent />
    </div>
  );
};

// For testing all the different styles, Will remove in DEMOS-677
const MOCK_PHASE_STATUS_LOOKUP: PhaseStatusLookup = {
  Concept: "skipped",
  "State Application": "completed",
  Completeness: "in_progress",
  "Federal Comment": "not_started",
  "SME/FRT": "not_started",
  "OGC & OMB": "not_started",
  "Approval Package": "not_started",
  "Post Approval": "not_started",
};

const MOCK_PHASE_DATE_LOOKUP: Partial<Record<PhaseName, Date>> = {
  Concept: new Date(2024, 4, 20),
  "State Application": new Date(2024, 4, 22),
  Completeness: new Date(2024, 11, 31),
};

export type PhaseStatusLookup = Record<PhaseName, PhaseStatus>;
interface PhaseSelectorProps {
  initialPhase?: PhaseName;
  phaseStatusLookup?: PhaseStatusLookup;
}

export const PhaseSelector = (props: PhaseSelectorProps) => {
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(props.initialPhase ?? "Concept");
  const [phaseStatusLookup, setPhaseStatusLookup] = useState<PhaseStatusLookup>(
    props.phaseStatusLookup ?? MOCK_PHASE_STATUS_LOOKUP
  );

  const updatePhaseStatus = useCallback((phase: PhaseName, status: PhaseStatus) => {
    setPhaseStatusLookup((prev) => {
      if (prev[phase] === status) return prev;
      return { ...prev, [phase]: status };
    });
  }, []);

  const contextValue = useMemo(
    () => ({ phaseStatusLookup, updatePhaseStatus }),
    [phaseStatusLookup, updatePhaseStatus]
  );

  return (
    <>
      <div className="grid grid-cols-8 gap-md mb-2">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, idx) => (
          <PhaseBox
            key={phaseName}
            phaseName={phaseName}
            phaseStatus={phaseStatusLookup[phaseName]}
            phaseNumber={idx + 1}
            displayDate={MOCK_PHASE_DATE_LOOKUP[phaseName]}
            isSelectedPhase={selectedPhase === phaseName}
            setPhaseAsSelected={() => setSelectedPhase(phaseName)}
          />
        ))}
      </div>
      <PhaseStatusContext.Provider value={contextValue}>
        <DisplayPhase selectedPhase={selectedPhase} />
      </PhaseStatusContext.Provider>
    </>
  );
};
