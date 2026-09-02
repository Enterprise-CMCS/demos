import React from "react";
import { compareDesc } from "date-fns";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { formatDateForServer } from "util/formatDate";
import type { PhaseName, PhaseStatus } from "demos-server";
import { TZDate } from "@date-fns/tz/date";
import { ConceptPhaseUploadSection } from "./ConceptPhaseUploadSection";
import { ConceptPhaseVerifyCompleteSection } from "./ConceptPhaseVerifyCompleteSection";

const CONCEPT_PHASE_NAME: PhaseName = "Concept";
export const CONCEPT_PHASE_DESCRIPTION_NAME = "concept-phase-description";
export const CONCEPT_PHASE_DESCRIPTION_TEXT =
  "Use the Concept Phase to track consultation and technical assistance to States before they submit a formal application. This phase can be skipped, especially if there is no concept paper to store.";

export const calculatePresubmissionDate = (
  initialPresubmissionDate: string,
  documents: ApplicationWorkflowDocument[]
): string => {
  // if a presubmission date is provided, return this
  if (initialPresubmissionDate) return initialPresubmissionDate;

  const presubmissionDocuments = documents.filter(
    (document) => document.documentType === "Pre-Submission"
  );

  // Guard: No presubmission documents means no date to return
  if (presubmissionDocuments.length === 0) return "";

  // Get latest createdAt date in EST from presubmission documents
  const createdAtDates = presubmissionDocuments.map((doc) => doc.createdAt);
  const sortedDates = createdAtDates.sort(compareDesc);
  const latestCreatedAtDateEST = new TZDate(sortedDates[0], "America/New_York");
  return formatDateForServer(latestCreatedAtDateEST);
};

export const getConceptPhaseComponentFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const conceptPhaseDocuments = application.documents.filter(
    (document) => document.phaseName === CONCEPT_PHASE_NAME
  );
  const conceptPhase = application.phases.find((phase) => phase.phaseName === CONCEPT_PHASE_NAME);

  if (!conceptPhase) {
    console.error("Concept phase data is missing for application:", application.id);
    return null;
  }

  const presubmissionSubmittedDate = conceptPhase.phaseDates.find(
    (date) => date.dateType === "Concept Paper Submitted Date"
  )?.dateValue;

  return (
    <ConceptPhase
      applicationId={application.id}
      documents={conceptPhaseDocuments}
      initialPresubmissionSubmittedDate={
        presubmissionSubmittedDate ? formatDateForServer(presubmissionSubmittedDate) : undefined
      }
      setSelectedPhase={setSelectedPhase}
      phaseStatus={conceptPhase.phaseStatus}
    />
  );
};

export interface ConceptPhaseProps {
  applicationId: string;
  documents: ApplicationWorkflowDocument[];
  setSelectedPhase: (phase: PhaseName) => void;
  initialPresubmissionSubmittedDate?: string;
  phaseStatus: PhaseStatus;
}

export const ConceptPhase = ({
  applicationId,
  documents,
  setSelectedPhase,
  initialPresubmissionSubmittedDate,
  phaseStatus,
}: ConceptPhaseProps) => {
  return (
    <div className="p-1">
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">CONCEPT</h3>
      <p
        data-testid={CONCEPT_PHASE_DESCRIPTION_NAME}
        className="text-sm text-text-placeholder mb-2"
      >
        {CONCEPT_PHASE_DESCRIPTION_TEXT}
      </p>

      <section className="bg-white">
        <div className="relative grid grid-cols-2 gap-10 py-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-full border-l border-surface-placeholder"
          />
          <ConceptPhaseUploadSection applicationId={applicationId} documents={documents} />
          <ConceptPhaseVerifyCompleteSection
            applicationId={applicationId}
            documents={documents}
            initialPresubmissionSubmittedDate={initialPresubmissionSubmittedDate}
            phaseStatus={phaseStatus}
            setSelectedPhase={setSelectedPhase}
          />
        </div>
      </section>
    </div>
  );
};
