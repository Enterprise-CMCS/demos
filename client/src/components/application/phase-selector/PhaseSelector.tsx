import React, { useState } from "react";

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
import { Phase } from "demos-server";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";

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

export type PhaseSelectorPhase = Exclude<Phase, "None">;
export type PhaseStatus = "skipped" | "not_started" | "in_progress" | "completed";

const MOCK_PHASE_DATE_LOOKUP: Partial<Record<PhaseName, Date>> = {
  Concept: new Date(2024, 4, 20),
  "State Application": new Date(2024, 4, 22),
  Completeness: new Date(2024, 11, 31),
  "Federal Comment": new Date(2025, 8, 24),
};

const FEDERAL_COMMENT_START_DATE = MOCK_PHASE_DATE_LOOKUP["Federal Comment"] as Date;

const PHASE_COMPONENTS_LOOKUP: Record<PhaseSelectorPhase, React.ComponentType> = {
  Concept: ConceptPhase,
  "State Application": StateApplicationPhase,
  Completeness: CompletenessPhase,
  "Federal Comment": () => {
    const phaseStartDate = FEDERAL_COMMENT_START_DATE;
    const phaseEndDate = new Date(phaseStartDate);
    phaseEndDate.setDate(phaseEndDate.getDate() + 30);

    return (
      <FederalCommentPhase
        phaseStartDate={phaseStartDate}
        phaseEndDate={phaseEndDate}
      />
    );
  },
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

export type PhaseStatusLookup = Record<PhaseName, PhaseStatus>;
interface PhaseSelectorProps {
  demonstration: ApplicationWorkflowDemonstration;
  phaseStatusLookup?: PhaseStatusLookup;
}

export const PhaseSelector = (props: PhaseSelectorProps) => {
  console.log(props.demonstration);
  const mappedInitialPhase = PHASE_NAMES.includes(props.demonstration.currentPhase as PhaseSelectorPhase)
    ? (props.demonstration.currentPhase as PhaseSelectorPhase)
    : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseSelectorPhase>(mappedInitialPhase);
  const [phaseStatusLookup] = useState<PhaseStatusLookup>(MOCK_PHASE_STATUS_LOOKUP);

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
      <DisplayPhase selectedPhase={selectedPhase} />
    </>
  );
};
