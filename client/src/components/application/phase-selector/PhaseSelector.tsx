import React, { useState } from "react";

import type { DateType, PhaseName, PhaseStatus as ServerPhaseStatus } from "demos-server";

import { WorkflowApplication, WorkflowApplicationType } from "components/application";
import {
  getApplicationCompletenessFromApplication,
  getConceptPhaseComponentFromApplication,
  getApplicationIntakeComponentFromApplication,
  getFederalCommentPhaseFromApplication,
  getApprovalPackagePhaseFromApplication,
  getReviewPhaseComponentFromApplication,
  getApprovalSummaryPhaseFromApplication,
  getSdgPreparationPhaseFromApplication,
} from "../phases";
import { PHASE_NAMES } from "demos-server-constants";
import { PhaseBox } from "./PhaseBox";

// TODO: get past-due added to the shared enum
export type PhaseStatus = ServerPhaseStatus | "past-due";

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

export const getDisplayedPhaseStatus = (
  application: WorkflowApplication,
  phaseName: PhaseName
): PhaseStatus => {
  const phase = application.phases.find((p) => p.phaseName === phaseName);
  return phase?.phaseStatus ?? "Not Started";
};

export const getDisplayedPhaseDate = (
  application: WorkflowApplication,
  phaseName: PhaseName
): Date | undefined => {
  const phase = application.phases.find((p) => p.phaseName === phaseName);
  if (!phase) return undefined;

  const relevantDateName = PHASE_DISPLAY_DATES[phaseName]?.[phase.phaseStatus];
  const relevantDate = phase.phaseDates.find((date) => date.dateType === relevantDateName);

  return relevantDate?.dateValue ? new Date(relevantDate.dateValue) : undefined;
};

export const PhaseSelector = ({
  application,
  workflowApplicationType,
}: {
  application: WorkflowApplication;
  workflowApplicationType: WorkflowApplicationType;
}) => {
  const initialPhase: PhaseName = application.currentPhaseName ?? "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  const renderPhase = (phaseName: PhaseName) => {
    switch (phaseName) {
      case "Concept":
        return getConceptPhaseComponentFromApplication(
          application,
          workflowApplicationType,
          setSelectedPhase
        );
      case "Application Intake":
        return getApplicationIntakeComponentFromApplication(application, setSelectedPhase);
      case "Completeness":
        return getApplicationCompletenessFromApplication(application, setSelectedPhase);
      case "Federal Comment":
        return getFederalCommentPhaseFromApplication(application);
      case "SDG Preparation":
        return getSdgPreparationPhaseFromApplication(application, setSelectedPhase);
      case "Review":
        return getReviewPhaseComponentFromApplication(application, () =>
          setSelectedPhase("Approval Package")
        );
      case "Approval Package":
        return getApprovalPackagePhaseFromApplication(application, setSelectedPhase);
      case "Approval Summary":
        // Approval Summary requires demonstration-specific fields
        // For now we will do type-assertion but to be revisted as we get further
        // down the line on developing these phases.
        return getApprovalSummaryPhaseFromApplication(application, workflowApplicationType);
    }
  };

  return (
    <>
      <div className="grid grid-cols-8 gap-md mb-2">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, index) => {
          const displayDate = getDisplayedPhaseDate(application, phaseName);
          const phaseStatus = getDisplayedPhaseStatus(application, phaseName);

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
      <div className="w-full h-full min-h-64">{renderPhase(selectedPhase)}</div>
    </>
  );
};
