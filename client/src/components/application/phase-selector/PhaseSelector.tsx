import React, { useCallback, useState } from "react";

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
import type { Phase, PhaseStatus as ServerPhaseStatus } from "demos-server";
import { PHASE } from "demos-server-constants";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { PhaseBox } from "./PhaseBox";
import { differenceInCalendarDays } from "date-fns";

export type PhaseSelectorPhase = Exclude<Phase, "None">;

export type PhaseStatus = ServerPhaseStatus | "past-due";

export const PHASE_NAMES: readonly PhaseSelectorPhase[] = PHASE.filter(
  (phase): phase is PhaseSelectorPhase => phase !== "None"
);
export type PhaseName = (typeof PHASE_NAMES)[number];

const getDisplayPhaseStatus = (status: ServerPhaseStatus, dueDate?: Date): PhaseStatus => {
  if (status === "Started" && dueDate) {
    return differenceInCalendarDays(dueDate, new Date()) < 0 ? "past-due" : "Started";
  }
  return status;
};

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

// For testing all the different styles, Will remove in DEMOS-677
const MOCK_PHASE_STATUS_LOOKUP: PhaseStatusLookup = {
  Concept: "Skipped",
  "State Application": "Completed",
  Completeness: "Started",
  "Federal Comment": "Not Started",
  "SME/FRT": "Not Started",
  "OGC & OMB": "Not Started",
  "Approval Package": "Not Started",
  "Post Approval": "Not Started",
};

export type PhaseStatusLookup = Record<PhaseName, ServerPhaseStatus>;
interface PhaseSelectorProps {
  demonstration: ApplicationWorkflowDemonstration;
  phaseStatusLookup?: PhaseStatusLookup;
}

export const PhaseSelector = ({ demonstration, phaseStatusLookup: initialPhaseStatus }: PhaseSelectorProps) => {
  const mappedInitialPhase = PHASE_NAMES.includes(demonstration.currentPhase as PhaseSelectorPhase)
    ? (demonstration.currentPhase as PhaseSelectorPhase)
    : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseSelectorPhase>(mappedInitialPhase);
  const [phaseStatusLookup, setPhaseStatusLookup] = useState<PhaseStatusLookup>(
    initialPhaseStatus ?? MOCK_PHASE_STATUS_LOOKUP
  );
  const [phaseDueDates, setPhaseDueDates] = useState<Partial<Record<PhaseName, Date>>>({});

  const updatePhaseStatus = useCallback((phase: PhaseName, status: ServerPhaseStatus) => {
    setPhaseStatusLookup((prev) => {
      if (prev[phase] === status) return prev;
      return { ...prev, [phase]: status };
    });
  }, []);

  const updatePhaseDueDate = useCallback((phase: PhaseName, dueDate: Date | undefined) => {
    setPhaseDueDates((prev) => {
      if (!dueDate) {
        if (!(phase in prev)) return prev;
        const { [phase]: removed, ...rest } = prev;
        void removed;
        return rest;
      }

      const existingTime = prev[phase]?.getTime();
      const nextTime = dueDate.getTime();
      if (existingTime === nextTime) {
        return prev;
      }

      return { ...prev, [phase]: dueDate };
    });
  }, []);

  const selectPhase = useCallback((phase: PhaseName) => {
    if (!PHASE_NAMES.includes(phase)) return;
    setSelectedPhase(phase as PhaseSelectorPhase);
  }, []);

  const selectNextPhase = useCallback((current: PhaseName) => {
    const currentIndex = PHASE_NAMES.indexOf(current);
    if (currentIndex === -1) return;
    const nextPhase = PHASE_NAMES[Math.min(currentIndex + 1, PHASE_NAMES.length - 1)];
    setSelectedPhase(nextPhase as PhaseSelectorPhase);
  }, []);

  const renderSelectedPhase = (phase: PhaseName) => {
    switch (phase) {
      case "Concept":
        return <ConceptPhase />;
      case "State Application":
        return <StateApplicationPhase />;
      case "Completeness":
        return (
          <CompletenessPhase
            phaseStatus={phaseStatusLookup.Completeness}
            onPhaseStatusChange={(status) => updatePhaseStatus("Completeness", status)}
            dueDate={phaseDueDates.Completeness}
            onDueDateChange={(date) => updatePhaseDueDate("Completeness", date)}
            onAdvancePhase={() => selectNextPhase("Completeness")}
          />
        );
      case "Federal Comment": {
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
      }
      case "SME/FRT":
        return <SmeFrtPhase />;
      case "OGC & OMB":
        return <OgcOmbPhase />;
      case "Approval Package":
        return <ApprovalPackagePhase />;
      case "Post Approval":
        return <PostApprovalPhase />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-8 gap-md mb-2">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, index) => {
          const dueDate = phaseDueDates[phaseName];
          const displayDate = dueDate ?? MOCK_PHASE_DATE_LOOKUP[phaseName];
          const displayStatus = getDisplayPhaseStatus(phaseStatusLookup[phaseName], dueDate);
          return (
            <PhaseBox
              key={phaseName}
              phaseName={phaseName}
              phaseStatus={displayStatus}
              phaseNumber={index + 1}
              displayDate={displayDate}
              isSelectedPhase={selectedPhase === phaseName}
              setPhaseAsSelected={() => setSelectedPhase(phaseName as PhaseSelectorPhase)}
            />
          );
        })}
      </div>
      <div className="w-full h-full min-h-64">{renderSelectedPhase(selectedPhase)}</div>
    </>
  );
};
