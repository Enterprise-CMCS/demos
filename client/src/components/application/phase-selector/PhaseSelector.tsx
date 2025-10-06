import React, { useState } from "react";

import type { PhaseName as ServerPhase, PhaseStatus as ServerPhaseStatus } from "demos-server";

import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import {
  ApprovalPackagePhase,
  CompletenessPhase,
  ConceptPhase,
  FederalCommentPhase,
  OgcOmbPhase,
  PostApprovalPhase,
  SdgPrepartionPhase,
  StateApplicationPhase,
} from "../phases";
import { PHASE_NAME } from "demos-server-constants";
import { PhaseBox } from "./PhaseBox";

// TODO: get past-due added to the shared enum
export type PhaseStatus = ServerPhaseStatus | "past-due";
export type PhaseName = Exclude<ServerPhase, "None">;
const PHASE_NAMES: PhaseName[] = PHASE_NAME.filter((phase): phase is PhaseName => phase !== "None");

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
  "SDG Preparation": "Not Started",
  "OGC & OMB Review": "Not Started",
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
  const fallbackPhase: PhaseName = "Concept";
  const initialPhase: PhaseName =
    demonstration.currentPhaseName && demonstration.currentPhaseName !== "None"
      ? (demonstration.currentPhaseName as PhaseName)
      : fallbackPhase;
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  const phaseComponentsLookup: Record<PhaseName, React.FC> = {
    Concept: ConceptPhase,
    "State Application": () => <StateApplicationPhase demonstrationId={demonstration.id} />,
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
    "SDG Preparation": SdgPrepartionPhase,
    "OGC & OMB Review": OgcOmbPhase,
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
