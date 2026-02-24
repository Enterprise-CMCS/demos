import React, { useState } from "react";

import type {
  DateType,
  PhaseName as ServerPhase,
  PhaseStatus as ServerPhaseStatus,
} from "demos-server";

import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import {
  getApplicationCompletenessFromDemonstration,
  getConceptPhaseComponentFromDemonstration,
  getApplicationIntakeComponentFromDemonstration,
  getFederalCommentPhaseFromDemonstration,
  getApprovalPackagePhase,
  getReviewPhaseComponentFromDemonstration,
  getApprovalSummaryPhase,
  getSdgPreparationPhaseFromDemonstration,
} from "../phases";
import { PHASE_NAME } from "demos-server-constants";
import { PhaseBox } from "./PhaseBox";

// TODO: get past-due added to the shared enum
export type PhaseStatus = ServerPhaseStatus | "past-due";
export type PhaseName = Exclude<ServerPhase, "None">;
const PHASE_NAMES: PhaseName[] = PHASE_NAME.filter((phase): phase is PhaseName => phase !== "None");

type PhaseDateDisplayMap = Record<PhaseName, Partial<Record<PhaseStatus, DateType>>>;

const PHASE_DISPLAY_DATES: PhaseDateDisplayMap = {
  Concept: {
    Started: "Concept Start Date",
    Completed: "Concept Completion Date",
    "Not Started": "Concept Start Date",
    Skipped: "Concept Skipped Date",
  },
  "Application Intake": {
    Started: "Application Intake Start Date",
    Completed: "Application Intake Completion Date",
    "Not Started": "Application Intake Start Date",
  },
  Completeness: {
    Started: "Completeness Start Date",
    Completed: "Completeness Completion Date",
    "Not Started": "Completeness Start Date",
  },
  "Federal Comment": {
    Started: "Federal Comment Period Start Date",
    Completed: "Federal Comment Period End Date",
    "Not Started": "Federal Comment Period Start Date",
  },
  "SDG Preparation": {
    Started: "SDG Preparation Start Date",
    Completed: "SDG Preparation Completion Date",
    "Not Started": "SDG Preparation Start Date",
  },
  Review: {
    Started: "Review Start Date",
    Completed: "Review Completion Date",
    "Not Started": "Review Start Date",
  },
  "Approval Package": {
    Started: "Approval Package Start Date",
    Completed: "Approval Package Completion Date",
    "Not Started": "Approval Package Start Date",
  },
  "Approval Summary": {
    Started: "Approval Summary Start Date",
    Completed: "Approval Summary Completion Date",
    "Not Started": "Approval Summary Start Date",
  },
} as const;

const PhaseGroups = () => {
  const leftBorderStyles = "border-l-1 border-surface-placeholder pl-2 -ml-sm";
  return (
    <>
      <span className="col-span-1">Pre-Submission</span>
      <span className={`col-span-3 ${leftBorderStyles}`}>Submission</span>
      <span className={`col-span-4 ${leftBorderStyles}`}>Approval</span>
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

  const relevantDateName = PHASE_DISPLAY_DATES[phaseName]?.[phase.phaseStatus];
  const relevantDate = phase.phaseDates.find((date) => date.dateType === relevantDateName);

  return relevantDate?.dateValue ? new Date(relevantDate.dateValue) : undefined;
};

export const PhaseSelector = ({ demonstration }: PhaseSelectorProps) => {
  const initialPhase: PhaseName =
    demonstration.currentPhaseName && demonstration.currentPhaseName !== "None"
      ? (demonstration.currentPhaseName as PhaseName)
      : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  const phaseComponentsLookup: Record<PhaseName, React.FC> = {
    Concept: () => getConceptPhaseComponentFromDemonstration(demonstration, setSelectedPhase),
    "Application Intake": () =>
      getApplicationIntakeComponentFromDemonstration(demonstration, setSelectedPhase),
    Completeness: () =>
      getApplicationCompletenessFromDemonstration(demonstration, setSelectedPhase),
    "Federal Comment": () => getFederalCommentPhaseFromDemonstration(demonstration),
    "SDG Preparation": () =>
      getSdgPreparationPhaseFromDemonstration(demonstration, setSelectedPhase),
    Review: () =>
      getReviewPhaseComponentFromDemonstration(demonstration, () =>
        setSelectedPhase("Approval Package")
      ),
    "Approval Package": () => getApprovalPackagePhase(demonstration, setSelectedPhase),
    "Approval Summary": () => getApprovalSummaryPhase(demonstration),
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
