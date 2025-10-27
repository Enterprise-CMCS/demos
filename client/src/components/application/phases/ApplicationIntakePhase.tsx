import React, { useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ApplicationIntakeUploadDialog } from "components/dialog/document/ApplicationIntakeUploadDialog";
import { DeleteIcon, ExportIcon } from "components/icons";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { addDays } from "date-fns";
import { tw } from "tags/tw";
import { formatDate, formatDateForServer } from "util/formatDate";

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

// Calculate completeness review due date (submitted date + 15 calendar days)
const getCompletenessReviewDueDate = (stateApplicationSubmittedDate: string): Date => {
  const date = Date.parse(stateApplicationSubmittedDate);
  return addDays(date, 15);
};
interface ApplicationIntakeProps {
  demonstrationId: string;
  initialStateApplicationDocuments?: DocumentTableDocument[];
  initialStateApplicationSubmittedDate?: string;
}

export const ApplicationIntakePhase = ({
  demonstrationId,
  initialStateApplicationDocuments = [],
  initialStateApplicationSubmittedDate,
}: ApplicationIntakeProps) => {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [stateApplicationDocuments] = useState<DocumentTableDocument[]>(
    initialStateApplicationDocuments ?? []
  );
  const [stateApplicationSubmittedDate, setStateApplicationSubmittedDate] = useState<string>(
    initialStateApplicationSubmittedDate ?? ""
  );
  const [isFinishButtonEnabled, setIsFinishButtonEnabled] = useState(false);

  useEffect(() => {
    console.log(stateApplicationDocuments, stateApplicationSubmittedDate);
    setIsFinishButtonEnabled(
      stateApplicationDocuments.length > 0 && Boolean(stateApplicationSubmittedDate)
    );
  }, [stateApplicationDocuments, stateApplicationSubmittedDate]);

  const onFinishButtonClick = async () => {
    // TODO: set dates and phase status
  };

  const UploadSection = () => (
    <div aria-labelledby="state-application-upload-title">
      <h4 id="state-application-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the State Application file below.</p>

      <SecondaryButton
        onClick={() => setUploadOpen(true)}
        size="small"
        name="button-open-upload-modal"
      >
        Upload
        <ExportIcon />
      </SecondaryButton>

      <div className={STYLES.list}>
        {stateApplicationDocuments.length == 0 && (
          <div className="text-sm text-text-placeholder">No documents yet.</div>
        )}
        {stateApplicationDocuments.map((doc: DocumentTableDocument) => (
          <div key={doc.id} className={STYLES.fileRow}>
            <div>
              <div className="font-medium">{doc.name}</div>
              <div className={STYLES.fileMeta}>
                {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
                {doc.description ? ` • ${doc.description}` : ""}
              </div>
            </div>
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => {
                // TODO: use mutator for deleting document
                console.log("Delete document:", doc.id);
              }}
              aria-label={`Delete ${doc.name}`}
              title={`Delete ${doc.name}`}
            >
              <DeleteIcon className="w-2 h-2" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const VerifyCompleteSection = () => (
    <div aria-labelledby="state-application-verify-title">
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="state-application-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document is uploaded/accurate and complete all required fields.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            State Application Submitted Date
          </label>
          <input
            type="date"
            value={stateApplicationSubmittedDate ?? undefined}
            onChange={(e) => setStateApplicationSubmittedDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            required
            aria-required="true"
          />
          {!stateApplicationDocuments && stateApplicationSubmittedDate && (
            <div className="text-xs text-text-warn mt-1">
              At least one State Application document is required when date is provided
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Completeness Review Due Date</label>
          <input
            type="date"
            value={
              stateApplicationSubmittedDate
                ? formatDateForServer(getCompletenessReviewDueDate(stateApplicationSubmittedDate))
                : ""
            }
            disabled
            className="w-full border border-border-fields px-1 py-1 text-sm rounded bg-gray-50 text-gray-600"
            aria-describedby="completeness-review-help"
          />
          <div id="completeness-review-help" className="text-xs text-text-placeholder mt-1">
            Automatically calculated as 15 calendar days after State Application Submitted Date
          </div>
        </div>
      </div>

      <div className={STYLES.actions}>
        <Button
          name="button-finish-state-application"
          onClick={onFinishButtonClick}
          disabled={!isFinishButtonEnabled}
          size="small"
        >
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">APPLICATION INTAKE</h3>
      <p className="text-sm text-text-placeholder mb-4">
        When the state submits an official application, completing this form closes the
        Pre-Submission Technical Assistance and opens the Completeness Review period
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection />
          <VerifyCompleteSection />
        </div>
      </section>

      <ApplicationIntakeUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        applicationId={demonstrationId}
      />
    </div>
  );
};
