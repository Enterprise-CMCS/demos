import React, { useEffect, useState } from "react";
import { useSessionStorage } from "hooks";
import { compareDesc } from "date-fns";

import { tw } from "tags/tw";

import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { formatDateForServer } from "util/formatDate";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage } from "util/messages";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import type { LocalDate, PhaseName, PhaseStatus } from "demos-server";
import {
  useCompletePhase,
  useSkipConceptPhase,
} from "components/application/phase-status/phaseCompletionQueries";
import { TZDate } from "@date-fns/tz/date";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import { ConceptPhaseUploadSection } from "./ConceptPhaseUploadSection";
import { ConceptPhaseVerifyCompleteSection } from "./ConceptPhaseVerifyCompleteSection";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10 py-1`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-surface-placeholder`,
  helper: tw`text-sm text-text-placeholder mb-2`,
};

const CONCEPT_PHASE_NAME: PhaseName = "Concept";
const NEXT_PHASE_NAME: PhaseName = "Application Intake";

export const CONCEPT_PHASE_DESCRIPTION = {
  testId: "concept-phase-description",
  text: "Use the Concept Phase to track consultation and technical assistance to States before they submit a formal application. This phase can be skipped, especially if there is no concept paper to store.",
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
  const { showSuccess } = useToast();
  const { setApplicationDate } = useSetApplicationDate();
  const { completePhase } = useCompletePhase();
  const { skipConceptPhase } = useSkipConceptPhase();
  const { currentUser } = getCurrentUser();

  // User can override the calculated date via the datepicker
  const [userSubmittedDateOverride, setUserSubmittedDateOverride] = useSessionStorage(
    `concept-phase-submitted-date-${applicationId}`
  );
  const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
  const [isSkipEnabled, setIsSkipEnabled] = useState<boolean>(true);

  const isPhaseFinalized = phaseStatus === "Completed" || phaseStatus === "Skipped";
  const isReadonlyUser = isReadonly(currentUser);

  // Calculate the submitted date based on documents
  const calculatedSubmittedDate = calculatePresubmissionDate(
    initialPresubmissionSubmittedDate ?? "",
    documents
  );

  // Use override if it exists, otherwise use calculated date
  const submittedDate = userSubmittedDateOverride || calculatedSubmittedDate;

  useEffect(() => {
    const finishShouldBeEnabled =
      !isPhaseFinalized &&
      documents.filter((document) => document.documentType === "Pre-Submission").length > 0 &&
      !!submittedDate;

    setIsFinishEnabled(finishShouldBeEnabled);
    setIsSkipEnabled(!finishShouldBeEnabled && !isPhaseFinalized);
  }, [submittedDate, documents, isPhaseFinalized]);

  const getDateValidationMessage = (): string => {
    if (
      documents.filter((document) => document.documentType === "Pre-Submission").length > 0 &&
      !submittedDate
    ) {
      return "Date is required when documents are uploaded";
    } else if (documents.length === 0 && submittedDate) {
      return "At least one Pre-Submission document is required when date is provided";
    }
    return "";
  };

  const onFinish = async () => {
    if (!submittedDate) {
      console.error("Submitted date is required before finishing Concept phase.");
      return;
    }

    try {
      await setApplicationDate({
        applicationId: applicationId,
        dateType: "Concept Paper Submitted Date",
        dateValue: submittedDate as LocalDate,
      });
    } catch (error) {
      console.error("Error setting application date:", error);
      return;
    }

    try {
      await completePhase({
        applicationId: applicationId,
        phaseName: CONCEPT_PHASE_NAME,
      });
    } catch (error) {
      console.error("Error completing concept phase:", error);
      return;
    }

    showSuccess(getPhaseCompletedMessage(CONCEPT_PHASE_NAME));
    setSelectedPhase(NEXT_PHASE_NAME);
  };

  const onSkip = async () => {
    try {
      await skipConceptPhase(applicationId);
    } catch (error) {
      console.error("Error skipping concept phase:", error);
      return;
    }

    showSuccess("Concept phase skipped");
    setSelectedPhase(NEXT_PHASE_NAME);
  };

  return (
    <div className="p-1">
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">CONCEPT</h3>
      <p data-testid={CONCEPT_PHASE_DESCRIPTION.testId} className={STYLES.helper}>
        {CONCEPT_PHASE_DESCRIPTION.text}
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <ConceptPhaseUploadSection applicationId={applicationId} documents={documents} />
          <ConceptPhaseVerifyCompleteSection
            documents={documents}
            submittedDate={submittedDate}
            isPhaseFinalized={isPhaseFinalized}
            isReadonlyUser={isReadonlyUser}
            isFinishEnabled={isFinishEnabled}
            isSkipEnabled={isSkipEnabled}
            onSubmittedDateChange={setUserSubmittedDateOverride}
            onFinish={onFinish}
            onSkip={onSkip}
            getDateValidationMessage={getDateValidationMessage}
          />
        </div>
      </section>
    </div>
  );
};
