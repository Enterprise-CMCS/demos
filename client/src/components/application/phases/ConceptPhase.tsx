import React, { useEffect, useState } from "react";
import { compareDesc } from "date-fns";

import { tw } from "tags/tw";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon, ExportIcon } from "components/icons";

import {
  WorkflowApplication,
  ApplicationWorkflowDocument,
  WorkflowApplicationType,
} from "components/application";
import { formatDateForServer } from "util/formatDate";
import { DocumentList } from "./sections";
import { useDialog } from "components/dialog/DialogContext";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, MISSING_REQUIRED_SECTIONS_TOOLTIP } from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import type { DateType, LocalDate, PhaseName, PhaseStatus } from "demos-server";
import {
  useCompletePhase,
  useSkipConceptPhase,
} from "components/application/phase-status/phaseCompletionQueries";
import { TZDate } from "@date-fns/tz/date";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10 py-1`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-surface-placeholder`,
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-1 uppercase`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex justify-end gap-3`,
};

const CONCEPT_PHASE_NAME: PhaseName = "Concept";
const NEXT_PHASE_NAME: PhaseName = "Application Intake";

export const UPLOAD_BUTTON_NAME = "button-open-upload-modal";
export const FINISH_BUTTON_NAME = "button-finish-concept";
export const SKIP_BUTTON_NAME = "button-skip-concept";
export const DATE_PICKER_NAME = "datepicker-pre-submission-date";

export const CONCEPT_PHASE_DESCRIPTION = {
  testId: "concept-phase-description",
  text: "Use the Concept Phase to track consultation and technical assistance to States before they submit a formal application. This phase can be skipped, especially if there is no concept paper to store.",
};

export const CONCEPT_PHASE_STEP_ONE_DESCRIPTION = {
  testId: "concept-phase-step-one-description",
  text: "Upload the Pre-Submission Concept Paper and any supplemental documents when they are available.",
};

export const CONCEPT_PHASE_STEP_TWO_DESCRIPTION = {
  testId: "concept-phase-step-two-description",
  text: "Check uploaded files. If needed, correct the Concept Paper submitted date before finishing the phase.",
};

export const getConceptPhaseComponentFromApplication = (
  application: WorkflowApplication,
  workflowApplicationType: WorkflowApplicationType,
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
  const { showConceptPreSubmissionDocumentUploadDialog } = useDialog();
  const { setApplicationDate } = useSetApplicationDate();
  const { completePhase } = useCompletePhase();
  const { skipConceptPhase } = useSkipConceptPhase();

  // User can override the calculated date via the datepicker
  const [userSubmittedDateOverride, setUserSubmittedDateOverride] = useState<string>("");
  const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
  const [isSkipEnabled, setIsSkipEnabled] = useState<boolean>(true);

  const isPhaseFinalized = phaseStatus === "Completed" || phaseStatus === "Skipped";

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

  const UploadSection = () => (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        Step 1 - Upload
      </h4>
      <p data-testid={CONCEPT_PHASE_STEP_ONE_DESCRIPTION.testId} className={STYLES.helper}>
        {CONCEPT_PHASE_STEP_ONE_DESCRIPTION.text}
      </p>

      <SecondaryButton
        onClick={() => showConceptPreSubmissionDocumentUploadDialog(applicationId)}
        size="small"
        name={UPLOAD_BUTTON_NAME}
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <DocumentList documents={documents} />
    </div>
  );

  const VerifyCompleteSection = () => (
    <div aria-labelledby="concept-verify-title">
      <h4 id="concept-verify-title" className={STYLES.title}>
        Step 2 - Verify/Complete
      </h4>
      <p data-testid={CONCEPT_PHASE_STEP_TWO_DESCRIPTION.testId} className={STYLES.helper}>
        {CONCEPT_PHASE_STEP_TWO_DESCRIPTION.text}
      </p>

      <div className="space-y-4">
        <div>
          <DatePicker
            name={DATE_PICKER_NAME}
            label={"Concept Paper Submitted Date" satisfies DateType}
            value={submittedDate}
            onChange={(newDate) => {
              setUserSubmittedDateOverride(newDate);
            }}
            isRequired={documents.length > 0}
            getValidationMessage={getDateValidationMessage}
            isDisabled={isPhaseFinalized}
          />
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name={SKIP_BUTTON_NAME}
          aria-label="Skip this section"
          onClick={onSkip}
          disabled={!isSkipEnabled}
        >
          Skip
          <ChevronRightIcon />
        </SecondaryButton>
        <Button
          name={FINISH_BUTTON_NAME}
          aria-label="Finish this section"
          onClick={onFinish}
          disabled={!isFinishEnabled}
          eagerTooltip={
            !isFinishEnabled && !isPhaseFinalized ? MISSING_REQUIRED_SECTIONS_TOOLTIP : undefined
          }
        >
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-1">
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">CONCEPT</h3>
      <p data-testid={CONCEPT_PHASE_DESCRIPTION.testId} className={STYLES.helper}>
        {CONCEPT_PHASE_DESCRIPTION.text}
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection />
          <VerifyCompleteSection />
        </div>
      </section>
    </div>
  );
};
