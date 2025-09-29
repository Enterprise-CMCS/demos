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
import { Phase } from "demos-server";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { PhaseBox } from "./PhaseBox";
import { PhaseStatusContext } from "./PhaseStatusContext";

export const PHASE_NAMES = [
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
export type PhaseStatus = "skipped" | "not_started" | "in_progress" | "completed" | "past_due";

export type PhaseDateLookupEntry = {
  displayDate?: Date;
  startDate?: Date;
  endDate?: Date;
};

export type PhaseDateLookup = Partial<Record<PhaseName, PhaseDateLookupEntry>>;

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
  phaseDateLookup?: PhaseDateLookup;
}

export const PhaseSelector = ({
  demonstration,
  phaseStatusLookup: initialPhaseStatus,
  phaseDateLookup,
}: PhaseSelectorProps) => {
  const mappedInitialPhase = PHASE_NAMES.includes(demonstration.currentPhase as PhaseSelectorPhase)
    ? (demonstration.currentPhase as PhaseSelectorPhase)
    : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseSelectorPhase>(mappedInitialPhase);
  const [phaseStatusLookup, setPhaseStatusLookup] = useState<PhaseStatusLookup>(
    initialPhaseStatus ?? MOCK_PHASE_STATUS_LOOKUP
  );

  const updatePhaseStatus = useCallback((phase: PhaseName, status: PhaseStatus) => {
    setPhaseStatusLookup((prev) => {
      if (prev[phase] === status) return prev;
      return { ...prev, [phase]: status };
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

  const contextValue = useMemo(
    () => ({ phaseStatusLookup, updatePhaseStatus, selectedPhase, selectPhase, selectNextPhase }),
    [phaseStatusLookup, updatePhaseStatus, selectedPhase, selectPhase, selectNextPhase]
  );

  const phaseComponentsLookup = useMemo<Record<PhaseSelectorPhase, React.ComponentType>>(() => {
    return {
      Concept: ConceptPhase,
      "State Application": StateApplicationPhase,
      Completeness: CompletenessPhase,
      "Federal Comment": () => {
        const phaseDates = phaseDateLookup?.["Federal Comment"];
        const phaseStartDate = phaseDates?.startDate;
        const phaseEndDate = phaseDates?.endDate;

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
  }, [demonstration.id, phaseDateLookup]);

  const DisplayPhase = ({ selectedPhase }: { selectedPhase: PhaseName }) => {
    const PhaseComponent = phaseComponentsLookup[selectedPhase as PhaseSelectorPhase];

    return (
      <div className="w-full h-full min-h-64">
        {PhaseComponent ? <PhaseComponent /> : null}
      </div>
    );
  };

  return (
    <PhaseStatusContext.Provider value={contextValue}>
      <div className="grid grid-cols-8 gap-md mb-2">
        <PhaseGroups />
        {PHASE_NAMES.map((phaseName, index) => {
          const displayDate = phaseDateLookup?.[phaseName]?.displayDate;
          return (
            <PhaseBox
              key={phaseName}
              phaseName={phaseName}
              phaseStatus={phaseStatusLookup[phaseName]}
              phaseNumber={index + 1}
              displayDate={displayDate}
              isSelectedPhase={selectedPhase === phaseName}
              setPhaseAsSelected={() => setSelectedPhase(phaseName as PhaseSelectorPhase)}
            />
          );
        })}
      </div>
      <DisplayPhase selectedPhase={selectedPhase} />
    </PhaseStatusContext.Provider>
  );
};
