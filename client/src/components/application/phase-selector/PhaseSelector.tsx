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
import type { PhaseMeta, PhaseMetaLookup } from "./PhaseStatusContext";

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
}

export const PhaseSelector = ({ demonstration, phaseStatusLookup: initialPhaseStatus }: PhaseSelectorProps) => {
  const mappedInitialPhase = PHASE_NAMES.includes(demonstration.currentPhase as PhaseSelectorPhase)
    ? (demonstration.currentPhase as PhaseSelectorPhase)
    : "Concept";
  const [selectedPhase, setSelectedPhase] = useState<PhaseSelectorPhase>(mappedInitialPhase);
  const [phaseStatusLookup, setPhaseStatusLookup] = useState<PhaseStatusLookup>(
    initialPhaseStatus ?? MOCK_PHASE_STATUS_LOOKUP
  );
  const [phaseMetaLookup, setPhaseMetaLookup] = useState<PhaseMetaLookup>({});

  const updatePhaseStatus = useCallback((phase: PhaseName, status: PhaseStatus) => {
    setPhaseStatusLookup((prev) => {
      if (prev[phase] === status) return prev;
      return { ...prev, [phase]: status };
    });
  }, []);

  const updatePhaseMeta = useCallback((phase: PhaseName, meta: PhaseMeta | undefined) => {
    setPhaseMetaLookup((prev) => {
      const existing = prev[phase];
      if (!meta) {
        if (existing === undefined) return prev;
        const { [phase]: _removed, ...rest } = prev;
        return rest;
      }

      const nextMeta: PhaseMeta = {
        ...existing,
        ...meta,
      };

      const hasDueDate = nextMeta.dueDate !== undefined;
      const hasPastDueFlag = nextMeta.isPastDue !== undefined;
      if (!hasDueDate && !hasPastDueFlag) {
        if (existing === undefined) return prev;
        const { [phase]: _removedMeta, ...rest } = prev;
        // I'm not sure the consequence of nuking this yet.
        console.log(_removedMeta);
        return rest;
      }

      const existingDueDateTime = existing?.dueDate?.getTime() ?? Number.NaN;
      const nextDueDateTime = nextMeta.dueDate?.getTime() ?? Number.NaN;
      const isSameDueDate = Number.isNaN(existingDueDateTime)
        ? Number.isNaN(nextDueDateTime)
        : existingDueDateTime === nextDueDateTime;
      const isSamePastDue = existing?.isPastDue === nextMeta.isPastDue;

      if (existing && isSameDueDate && isSamePastDue) {
        return prev;
      }

      return { ...prev, [phase]: nextMeta };
    });
  }, []);

  const contextValue = useMemo(
    () => ({ phaseStatusLookup, updatePhaseStatus, phaseMetaLookup, updatePhaseMeta }),
    [phaseStatusLookup, updatePhaseStatus, phaseMetaLookup, updatePhaseMeta]
  );

  const phaseComponentsLookup = useMemo<Record<PhaseSelectorPhase, React.ComponentType>>(() => {
    return {
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
  }, [demonstration.id]);

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
          const meta = phaseMetaLookup[phaseName];
          const displayDate = meta ? meta.dueDate : MOCK_PHASE_DATE_LOOKUP[phaseName];
          return (
            <PhaseBox
              key={phaseName}
              phaseName={phaseName}
              phaseStatus={phaseStatusLookup[phaseName]}
              phaseNumber={index + 1}
              displayDate={displayDate}
              isPastDue={meta?.isPastDue ?? false}
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
