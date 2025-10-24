import React, { useEffect, useMemo, useState } from "react";

import type {
  PhaseName as ServerPhase,
  PhaseStatus as ServerPhaseStatus,
  ApplicationPhase,
} from "demos-server";
import { PHASE_NAME } from "demos-server-constants";

import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import {
  ApprovalPackagePhase,
  ApplicationIntakePhase,
  CompletenessPhase,
  ConceptPhase,
  FederalCommentPhase,
  OgcOmbPhase,
  PostApprovalPhase,
  SdgPreparationPhase,
} from "../phases";
import { PhaseBox } from "./PhaseBox";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";

export type PhaseStatus = ServerPhaseStatus | "past-due";
export type PhaseName = Exclude<ServerPhase, "None">;

const PHASE_NAMES: PhaseName[] = PHASE_NAME.filter(
  (phase): phase is PhaseName => phase !== "None"
);

const DISPLAY_DATE_PRIORITY: Partial<Record<PhaseName, string[]>> = {
  Concept: ["Concept Completion Date", "Concept Start Date"],
  "Application Intake": [
    "Application Intake Completion Date",
    "Application Intake Start Date",
    "State Application Submitted Date",
  ],
  Completeness: [
    "Completeness Completion Date",
    "Completeness Start Date",
    "Completeness Review Due Date",
  ],
  "Federal Comment": [
    "Federal Comment Period End Date",
    "Federal Comment Period Start Date",
  ],
  "SDG Preparation": ["SDG Preparation Completion Date", "SDG Preparation Start Date"],
  "OGC & OMB Review": ["OGC & OMB Review Completion Date", "OGC & OMB Review Start Date"],
  "Approval Package": ["PO & OGD Sign-Off"],
  "Post Approval": [],
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

const findPhaseDateValue = (phase: ApplicationPhase | undefined, dateType: string): Date | null => {
  const match = phase?.phaseDates.find((date) => date.dateType === dateType);
  return match ? match.dateValue : null;
};

type PhaseSelectorProps = {
  demonstration: ApplicationWorkflowDemonstration;
};

export const PhaseSelector = ({ demonstration }: PhaseSelectorProps) => {
  const fallbackPhase: PhaseName = "Concept";
  const initialPhase: PhaseName =
    demonstration.currentPhaseName && demonstration.currentPhaseName !== "None"
      ? (demonstration.currentPhaseName as PhaseName)
      : fallbackPhase;
  const [selectedPhase, setSelectedPhase] = useState<PhaseName>(initialPhase);

  useEffect(() => {
    if (
      demonstration.currentPhaseName &&
      demonstration.currentPhaseName !== "None" &&
      demonstration.currentPhaseName !== selectedPhase
    ) {
      setSelectedPhase(demonstration.currentPhaseName as PhaseName);
    }
  }, [demonstration.currentPhaseName, selectedPhase]);

  const phases = demonstration.phases ?? [];
  const documents = (demonstration.documents as DocumentTableDocument[]) ?? [];

  const phaseLookup = useMemo(() => {
    const map = new Map<PhaseName, ApplicationPhase>();
    phases.forEach((phase) => {
      if (phase.phaseName !== "None") {
        map.set(phase.phaseName as PhaseName, phase);
      }
    });
    return map;
  }, [phases]);

  const statusLookup = useMemo(() => {
    const map = new Map<PhaseName, PhaseStatus>();
    phases.forEach((phase) => {
      if (phase.phaseName !== "None") {
        map.set(phase.phaseName as PhaseName, phase.phaseStatus as PhaseStatus);
      }
    });
    return map;
  }, [phases]);

  const getPhaseStatus = (phaseName: PhaseName): PhaseStatus => {
    return statusLookup.get(phaseName) ?? "Not Started";
  };

  const getPhaseDisplayDate = (phaseName: PhaseName): Date | undefined => {
    const phase = phaseLookup.get(phaseName);
    if (!phase) {
      return undefined;
    }

    const priorityList = DISPLAY_DATE_PRIORITY[phaseName];
    if (!priorityList) {
      return undefined;
    }

    for (const dateType of priorityList) {
      const dateValue = findPhaseDateValue(phase, dateType);
      if (dateValue) {
        return dateValue;
      }
    }

    return undefined;
  };

  const phaseComponentsLookup: Record<PhaseName, React.FC> = {
    Concept: ConceptPhase,
    "Application Intake": () => <ApplicationIntakePhase demonstrationId={demonstration.id} />,
    Completeness: () => (
      <CompletenessPhase
        demonstrationId={demonstration.id}
        completenessPhase={phaseLookup.get("Completeness")}
        applicationIntakePhaseStatus={phaseLookup.get("Application Intake")?.phaseStatus ?? null}
        documents={documents}
        onPhaseFinished={() => setSelectedPhase("Federal Comment")}
      />
    ),
    "Federal Comment": () => {
      const federalPhase = phaseLookup.get("Federal Comment");
      const phaseStartDate =
        findPhaseDateValue(federalPhase, "Federal Comment Period Start Date") ?? new Date();
      const phaseEndDate =
        findPhaseDateValue(federalPhase, "Federal Comment Period End Date") ??
        addThirtyDays(phaseStartDate);

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
          const displayDate = getPhaseDisplayDate(phaseName);
          const displayStatus = getPhaseStatus(phaseName);
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

function addThirtyDays(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 30);
  return endDate;
}
