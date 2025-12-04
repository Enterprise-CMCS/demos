import React, { useState } from "react";

import { tw } from "tags/tw";
import { Button, SecondaryButton } from "components/button";
import { ChevronRightIcon, ExportIcon } from "components/icons";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";

import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";
import { formatDateForServer, getTodayEst } from "util/formatDate";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DocumentList } from "./sections";
import { useDialog } from "components/dialog/DialogContext";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage } from "util/messages";

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

const DEMONSTRATION_TYPE_OPTIONS: Option[] = [
  { label: "Section 1115", value: "1115" },
  { label: "Section 1915(b)", value: "1915b" },
  { label: "Section 1915(c)", value: "1915c" },
];

export const getConceptPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const preSubmissionDocuments = demonstration.documents.filter(
    (document) => document.documentType === "Pre-Submission"
  );

  return (
    <ConceptPhase
      demonstrationId={demonstration.id}
      initialPreSubmissionDocuments={preSubmissionDocuments}
    />
  );
};

export interface ConceptProps {
  demonstrationId: string;
  initialPreSubmissionDocuments: ApplicationWorkflowDocument[];
}

export const ConceptPhase = ({
  demonstrationId = "default-demo-id",
  initialPreSubmissionDocuments,
}: ConceptProps) => {
  const { showSuccess } = useToast();
  const { showConceptPreSubmissionDocumentUploadDialog } = useDialog();
  const [dateSubmitted, setDateSubmitted] = useState<string>("");
  const [demoType, setDemoType] = useState<string>("");

  const [preSubmissionDocuments] = useState<ApplicationWorkflowDocument[]>(
    initialPreSubmissionDocuments
  );

  const { setPhaseStatus: completeConcept } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Concept",
    phaseStatus: "Completed",
  });

  const { setPhaseStatus: skipConcept } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Concept",
    phaseStatus: "Skipped",
  });

  const handleDocumentUploadSucceeded = async () => {
    setDateSubmitted(getTodayEst());
  };

  React.useEffect(() => {
    if (preSubmissionDocuments.length > 0 && !dateSubmitted) {
      const latestDoc = preSubmissionDocuments[preSubmissionDocuments.length - 1];
      if (latestDoc.createdAt) {
        setDateSubmitted(formatDateForServer(latestDoc.createdAt));
      }
    }
  }, [preSubmissionDocuments, dateSubmitted]);

  const hasPreSubmissionDocuments = preSubmissionDocuments.length > 0;
  const hasDatePopulated = dateSubmitted.length > 0;
  const hasAnyActivity = hasPreSubmissionDocuments || hasDatePopulated;

  const isFinishEnabled = hasPreSubmissionDocuments && hasDatePopulated;
  const isSkipEnabled = !hasAnyActivity;

  const onFinish = async () => {
    await completeConcept();
    showSuccess(getPhaseCompletedMessage("Concept"));
  };

  const onSkip = async () => {
    await skipConcept();
    showSuccess("Concept phase skipped");
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

      <DocumentList documents={preSubmissionDocuments} />
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
          <label htmlFor="preSubmissionDate" className="block text-sm font-bold mb-1">
            {hasPreSubmissionDocuments && <span className="text-text-warn mr-1">*</span>}
            Pre-Submission Document Submitted Date
          </label>
          <input
            id="preSubmissionDate"
            type="date"
            value={dateSubmitted}
            onChange={(e) => setDateSubmitted(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            aria-required={hasPreSubmissionDocuments}
          />
          {hasPreSubmissionDocuments && !dateSubmitted && (
            <div className="text-xs text-text-warn mt-1">
              Date is required when documents are uploaded
            </div>
          )}
          {!hasPreSubmissionDocuments && dateSubmitted && (
            <div className="text-xs text-text-warn mt-1">
              At least one Pre-Submission document is required when date is provided
            </div>
          )}
        </div>

        <AutoCompleteSelect
          id="demo-type"
          label="Demonstration Type(s) Requested"
          options={DEMONSTRATION_TYPE_OPTIONS}
          value={demoType}
          onSelect={(v) => setDemoType(String(v))}
        />
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name="button-skip-concept"
          onClick={onSkip}
          size="small"
          disabled={!isSkipEnabled}
        >
          Skip
          <ChevronRightIcon />
        </SecondaryButton>
        <Button
          name="button-finish-concept"
          onClick={onFinish}
          disabled={!isFinishEnabled}
          size="small"
        >
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
