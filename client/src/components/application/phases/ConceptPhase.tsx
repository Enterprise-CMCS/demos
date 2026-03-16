import React, { useEffect, useRef, useState } from "react";
import { compareDesc } from "date-fns";

import { tw } from "tags/tw";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon, ExportIcon } from "components/icons";

import {
  WorkflowApplication,
  ApplicationWorkflowDocument,
  WorkflowApplicationType,
} from "components/application";
import { formatDateForServer, getTodayEst } from "util/formatDate";
import { DocumentList } from "./sections";
import { useDialog } from "components/dialog/DialogContext";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage } from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { PhaseName } from "components/application/phase-selector/PhaseSelector";
import type { LocalDate, PhaseStatus, UploadDocumentInput } from "demos-server";
import {
  useCompletePhase,
  useSkipConceptPhase,
} from "components/application/phase-status/phaseCompletionQueries";

const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
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
    (date) => date.dateType === "Pre-Submission Submitted Date"
  )?.dateValue;

  return (
    <ConceptPhase
      applicationId={application.id}
      documents={conceptPhaseDocuments}
      initialPresubmissionSubmittedDate={
        presubmissionSubmittedDate ? formatDateForServer(presubmissionSubmittedDate) : undefined
      }
      setSelectedPhase={setSelectedPhase}
      workflowApplicationType={workflowApplicationType}
      phaseStatus={conceptPhase.phaseStatus}
    />
  );
};

export const getPresubmissionDate = (
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

  // Get latest createdAt date from presubmission documents
  const createdAtDates = presubmissionDocuments.map((doc) => doc.createdAt);
  const sortedDates = createdAtDates.sort(compareDesc);
  return formatDateForServer(sortedDates[0]);
};

export interface ConceptPhaseProps {
  applicationId: string;
  documents: ApplicationWorkflowDocument[];
  setSelectedPhase: (phase: PhaseName) => void;
  initialPresubmissionSubmittedDate?: string;
  workflowApplicationType: WorkflowApplicationType;
  phaseStatus: PhaseStatus;
}

export const ConceptPhase = ({
  applicationId,
  documents,
  setSelectedPhase,
  initialPresubmissionSubmittedDate,
  workflowApplicationType,
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
  const calculatedSubmittedDate = getPresubmissionDate(
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
        dateType: "Pre-Submission Submitted Date",
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

  const UploadSection = ({
    workflowApplicationType,
  }: {
    workflowApplicationType: WorkflowApplicationType;
  }) => (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>
        Upload the Pre-Submission Document describing your {workflowApplicationType}.
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
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="concept-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document is uploaded/accurate and that all the required fields are filled.
      </p>

      <div className="space-y-4">
        <div>
          <DatePicker
            name="datepicker-pre-submission-date"
            label="Pre-Submission Document Submitted Date"
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
        <SecondaryButton name={SKIP_BUTTON_NAME} onClick={onSkip} disabled={!isSkipEnabled}>
          Skip
          <ChevronRightIcon />
        </SecondaryButton>
        <Button name={FINISH_BUTTON_NAME} onClick={onFinish} disabled={!isFinishEnabled}>
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">CONCEPT</h3>
      <p className="text-sm text-text-placeholder mb-4">
        Pre-Submission Consultation and Technical Assistance – Time spent with the state prior to
        the formal submission
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection workflowApplicationType={workflowApplicationType} />
          <VerifyCompleteSection />
        </div>
      </section>
    </div>
  );
};
