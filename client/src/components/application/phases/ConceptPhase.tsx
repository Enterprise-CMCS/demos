import React, { useEffect, useState } from "react";

import { tw } from "tags/tw";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon, ExportIcon } from "components/icons";

import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";
import { formatDateForServer, getTodayEst } from "util/formatDate";
import { DocumentList } from "./sections";
import { useDialog } from "components/dialog/DialogContext";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage } from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { PhaseName } from "../phase-selector/PhaseSelector";
import type { LocalDate, UploadDocumentInput } from "demos-server";
import { useCompletePhase, useSkipConceptPhase } from "../phase-status/phaseCompletionQueries";

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

export const getConceptPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration,
  setSelectedPhase?: (phase: PhaseName) => void
) => {
  const preSubmissionDocuments = demonstration.documents.filter(
    (document) => document.phaseName === "Concept"
  );

  return (
    <ConceptPhase
      demonstrationId={demonstration.id}
      initialPreSubmissionDocuments={preSubmissionDocuments}
      setSelectedPhase={setSelectedPhase}
    />
  );
};

const getLatestPresubmissionDocumentDate = (
  documents: ApplicationWorkflowDocument[]
): LocalDate | null => {
  const presubmissionDocuments = documents.filter(
    (document) => document.documentType === "Pre-Submission"
  );

  if (presubmissionDocuments.length === 0) return null;

  const createdAtDates = presubmissionDocuments.map((doc) => doc.createdAt);
  const sortedDates = createdAtDates.sort((dateA, dateB) => {
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return formatDateForServer(sortedDates[0]);
};

export interface ConceptProps {
  demonstrationId: string;
  initialPreSubmissionDocuments: ApplicationWorkflowDocument[];
  setSelectedPhase?: (phase: PhaseName) => void;
}

export const ConceptPhase = ({
  demonstrationId,
  initialPreSubmissionDocuments,
  setSelectedPhase,
}: ConceptProps) => {
  const { showSuccess } = useToast();
  const { showConceptPreSubmissionDocumentUploadDialog } = useDialog();
  const { setApplicationDate } = useSetApplicationDate();

  const [submittedDate, setSubmittedDate] = useState<LocalDate | null>(
    getLatestPresubmissionDocumentDate(initialPreSubmissionDocuments)
  );
  const [isFinishEnabled, setIsFinishEnabled] = useState<boolean>(false);
  const [isSkipEnabled, setIsSkipEnabled] = useState<boolean>(true);
  const [documents] = useState<ApplicationWorkflowDocument[]>(initialPreSubmissionDocuments);

  const advanceToNextPhase = () => {
    setSelectedPhase?.("Application Intake");
  };

  useEffect(() => {
    const finishShouldBeEnabled =
      documents.filter((document) => document.documentType === "Pre-Submission").length > 0 &&
      !!submittedDate;
    setIsFinishEnabled(finishShouldBeEnabled);
    setIsSkipEnabled(!finishShouldBeEnabled);
  }, [submittedDate, documents]);

  const { completePhase } = useCompletePhase();
  const { skipConceptPhase } = useSkipConceptPhase();

  const handleDocumentUploadSucceeded = (payload?: UploadDocumentInput) => {
    if (payload?.documentType === "Pre-Submission") {
      const todayEst = getTodayEst();
      setSubmittedDate(todayEst);
    }
  };

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

    const payloadDate: LocalDate = submittedDate;
    try {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Pre-Submission Submitted Date",
        dateValue: payloadDate,
      });
    } catch (error) {
      console.error("Error setting application date:", error);
      return;
    }

    try {
      await completePhase({
        applicationId: demonstrationId,
        phaseName: "Concept",
      });
    } catch (error) {
      console.error("Error completing concept phase:", error);
      return;
    }

    showSuccess(getPhaseCompletedMessage("Concept"));
    advanceToNextPhase();
  };

  const onSkip = async () => {
    try {
      await skipConceptPhase(demonstrationId);
    } catch (error) {
      console.error("Error skipping concept phase:", error);
      return;
    }

    showSuccess("Concept phase skipped");
    advanceToNextPhase();
  };

  const UploadSection = () => (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>
        Upload the Pre-Submission Document describing your demonstration.
      </p>

      <SecondaryButton
        onClick={() =>
          showConceptPreSubmissionDocumentUploadDialog(
            demonstrationId,
            handleDocumentUploadSucceeded
          )
        }
        size="small"
        name="button-open-upload-modal"
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
            value={submittedDate ?? ""}
            onChange={(newDate) => {
              setSubmittedDate(newDate === "" ? null : (newDate as LocalDate));
            }}
            isRequired={documents.length > 0}
            getValidationMessage={getDateValidationMessage}
          />
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton name="button-skip-concept" onClick={onSkip} disabled={!isSkipEnabled}>
          Skip
          <ChevronRightIcon />
        </SecondaryButton>
        <Button name="button-finish-concept" onClick={onFinish} disabled={!isFinishEnabled}>
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
          <UploadSection />
          <VerifyCompleteSection />
        </div>
      </section>
    </div>
  );
};
