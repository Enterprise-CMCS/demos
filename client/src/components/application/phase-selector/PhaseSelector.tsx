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
import type { Phase as ServerPhase, PhaseStatus as ServerPhaseStatus } from "demos-server";
import { PHASE } from "demos-server-constants";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { PhaseBox } from "./PhaseBox";

// TODO: get past-due added to the shared enum
export type PhaseStatus = ServerPhaseStatus | "past-due";
export type PhaseName = Exclude<ServerPhase, "None">;
const PHASE_NAMES = PHASE.filter((p) => p !== "None");

const MOCK_PHASE_DATE_LOOKUP: Partial<Record<PhaseName, Date>> = {
  Concept: new Date(2024, 4, 20),
  "State Application": new Date(2024, 4, 22),
  Completeness: new Date(2024, 11, 31),
  "Federal Comment": new Date(2025, 8, 24),
};

const FEDERAL_COMMENT_START_DATE = MOCK_PHASE_DATE_LOOKUP["Federal Comment"] as Date;

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

const MOCK_PHASE_STATUS_LOOKUP: PhaseStatusLookup = {
  Concept: "Skipped",
  "State Application": "Completed",
  Completeness: "Started",
  "Federal Comment": "past-due",
  "SME/FRT": "Not Started",
  "OGC & OMB": "Not Started",
  "Approval Package": "Not Started",
  "Post Approval": "Not Started",
};

export type PhaseStatusLookup = Record<PhaseName, PhaseStatus>;
interface PhaseSelectorProps {
  demonstration: ApplicationWorkflowDemonstration;
  phaseStatusLookup?: PhaseStatusLookup;
}

export const PhaseSelector = ({
  demonstration,
  phaseStatusLookup = MOCK_PHASE_STATUS_LOOKUP,
}: PhaseSelectorProps) => {
  const demonstrationPhase = demonstration.currentPhase ?? "Concept";
  const initialPhase = demonstrationPhase === "None" ? "Concept" : demonstrationPhase;
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  console.log("initialPhase", initialPhase);
  console.log("selectedPhase", selectedPhase);

  const phaseComponentsLookup: Record<PhaseName, React.FC> = {
    Concept: ConceptPhase,
    "State Application": StateApplicationPhase,
    Completeness: CompletenessPhase,
    "Federal Comment": () => {
      const phaseStartDate = FEDERAL_COMMENT_START_DATE;
      const phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setDate(phaseEndDate.getDate() + 30);

      return (
        <FederalCommentPhase
          demonstrationId={demonstration.id}
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

  const DisplayPhase = ({ selectedPhase }: { selectedPhase: PhaseName }) => {
    const PhaseComponent = phaseComponentsLookup[selectedPhase];

    return (
      <div className="w-full h-full min-h-64">
        <PhaseComponent />
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-8 gap-md mb-2">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, index) => {
          const displayDate = MOCK_PHASE_DATE_LOOKUP[phaseName];
          const displayStatus = phaseStatusLookup[phaseName];
          return (
            <PhaseBox
              key={phaseName}
              phaseName={phaseName}
              phaseStatus={displayStatus}
              phaseNumber={index + 1}
              displayDate={displayDate}
              isSelectedPhase={selectedPhase === phaseName}
              setPhaseAsSelected={() => setSelectedPhase(phaseName)}
            />
          );
        })}
      </div>
      <DisplayPhase selectedPhase={selectedPhase} />
    </>
  );
};
