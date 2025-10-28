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
  SdgPreparationPhase,
  getApplicationIntakeComponentFromDemonstration,
} from "../phases";
import { PHASE_NAME } from "demos-server-constants";
import { PhaseBox } from "./PhaseBox";

// TODO: get past-due added to the shared enum
export type PhaseStatus = ServerPhaseStatus | "past-due";
export type PhaseName = Exclude<ServerPhase, "None">;
const PHASE_NAMES: PhaseName[] = PHASE_NAME.filter((phase): phase is PhaseName => phase !== "None");

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

interface PhaseSelectorProps {
  demonstration: ApplicationWorkflowDemonstration;
}

export const getDisplayedPhaseStatus = (
  demonstration: ApplicationWorkflowDemonstration,
  phaseName: PhaseName
): PhaseStatus => {
  const phase = demonstration.phases.find((p) => p.phaseName === phaseName);
  return phase?.phaseStatus ?? "Not Started";
};

export const getDisplayedPhaseDate = (
  demonstration: ApplicationWorkflowDemonstration,
  phaseName: PhaseName
): Date | undefined => {
  const phase = demonstration.phases.find((p) => p.phaseName === phaseName);
  if (!phase) return undefined;

  // Find the most relevant date for display
  // Prioritize completion dates, then submitted dates, then start dates
  const relevantDate =
    phase.phaseDates.find(
      (date) => date.dateType.includes("Completion Date") || date.dateType.includes("Complete")
    ) ||
    phase.phaseDates.find((date) => date.dateType.includes("Submitted")) ||
    phase.phaseDates.find((date) => date.dateType.includes("Start Date")) ||
    phase.phaseDates[0];

  return relevantDate?.dateValue ? new Date(relevantDate.dateValue) : undefined;
};

export const PhaseSelector = ({ demonstration }: PhaseSelectorProps) => {
  const initialPhase: PhaseName =
    demonstration.currentPhaseName && demonstration.currentPhaseName !== "None"
      ? (demonstration.currentPhaseName as PhaseName)
      : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  const phaseComponentsLookup: Record<PhaseName, React.FC> = {
    Concept: ConceptPhase,
    "Application Intake": () => getApplicationIntakeComponentFromDemonstration(demonstration),
    Completeness: CompletenessPhase,
    "Federal Comment": () => {
      const phaseStartDate = new Date(2025, 8, 24);
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
    "SDG Preparation": SdgPreparationPhase,
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
          const displayDate = getDisplayedPhaseDate(demonstration, phaseName);
          const phaseStatus = getDisplayedPhaseStatus(demonstration, phaseName);

          return (
            <PhaseBox
              key={phaseName}
              phaseName={phaseName}
              phaseStatus={phaseStatus}
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
