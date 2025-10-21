import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ApplicationIntakeUploadDialog } from "components/dialog/document/ApplicationIntakeUploadDialog";
import { DeleteIcon, ExportIcon } from "components/icons";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { useToast } from "components/toast";
import { isLocalDevelopment } from "config/env";
import { addDays } from "date-fns";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";

import { gql, useMutation } from "@apollo/client";

const COMPLETE_STATE_APPLICATION_PHASE = gql`
  mutation CompleteApplicationIntakePhase($input: CompleteApplicationIntakePhaseInput!) {
    completeApplicationIntakePhase(input: $input) {
      id
      success
    }
  }
`;

type Props = {
  demonstrationId: string;
  documents?: DocumentTableDocument[];
  onDocumentsRefetch?: () => void;
};

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

// Format date as YYYY-MM-DD for input fields
const formatDateForInput = (date: Date): string => {
  // Use native date input format (yyyy-MM-dd)
  // eslint-disable-next-line no-nonstandard-date-formatting/no-nonstandard-date-formatting
  const isoString = date.toISOString();
  return isoString.split("T")[0];
};

export const ApplicationIntakePhase: React.FC<Props> = ({
  demonstrationId,
  documents = [],
  onDocumentsRefetch,
}) => {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string>("");

  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);
  const { showError } = useToast();

  const allDocuments = documents.length > 0 ? documents : mockDocuments;

  const [completePhase, { loading: finishing }] = useMutation(COMPLETE_STATE_APPLICATION_PHASE, {
    onCompleted: () => onDocumentsRefetch?.(),
  });

  const stateApplicationDocuments = allDocuments.filter(
    (doc: DocumentTableDocument) =>
      doc.documentType === "State Application" ||
      doc.name?.toLowerCase().includes("state application") ||
      doc.description?.toLowerCase().includes("state application")
  );

  // Auto-populate submitted date when first State Application document is uploaded
  React.useEffect(() => {
    if (stateApplicationDocuments.length > 0 && !submittedDate) {
      const firstDoc = stateApplicationDocuments[0];
      if (firstDoc.createdAt) {
        const uploadDate = new Date(firstDoc.createdAt);
        setSubmittedDate(formatDateForInput(uploadDate));
      }
    }
  }, [stateApplicationDocuments, submittedDate]);

  const hasStateApplicationDocuments = stateApplicationDocuments.length > 0;
  const hasSubmittedDate = submittedDate.length > 0;

  // Calculate completeness review due date (submitted date + 15 calendar days)
  const completenessReviewDueDate = hasSubmittedDate ? addDays(new Date(submittedDate), 15) : null;

  const isFinishEnabled = hasStateApplicationDocuments && hasSubmittedDate && !finishing;

  const onFinish = async () => {
    if (!hasStateApplicationDocuments) {
      showError("At least one State Application document is required.");
      return;
    }
    if (!hasSubmittedDate) {
      showError("State Application Submitted Date is required.");
      return;
    }

    await completePhase({
      variables: {
        input: {
          demonstrationId,
          submittedDate,
          completenessReviewDueDate: completenessReviewDueDate
            ? formatDateForInput(completenessReviewDueDate)
            : null,
        },
      },
    });
  };

  // Simplified mock document helpers for testing UI styles
  const addMockDocument = () => {
    const newDoc: DocumentTableDocument = {
      id: `mock-${Date.now()}`,
      name: `State Application Document ${mockDocuments.length + 1}`,
      description: "Mock document for testing UI",
      documentType: "State Application",
      createdAt: new Date(),
      owner: { person: { fullName: "Test User" } },
    };
    setMockDocuments((prev) => [...prev, newDoc]);
  };

  const clearAllMockDocuments = () => {
    setMockDocuments([]);
  };

  // Minimal Testing Panel (Development Only) - focused on UI testing
  const TestingPanel = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="text-sm font-bold text-yellow-800 mb-2">UI Testing Panel</h4>
      <div className="flex gap-2">
        <button
          onClick={addMockDocument}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Add Mock Doc
        </button>
        <button
          onClick={clearAllMockDocuments}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear All
        </button>
      </div>
    </div>
  );

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
        {stateApplicationDocuments.length === 0 && (
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
                if (doc.id.startsWith("mock-")) {
                  setMockDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                } else {
                  // TODO: wire to RemoveDocumentDialog for real documents
                  console.log("Delete document:", doc.id);
                }
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
            value={submittedDate}
            onChange={(e) => setSubmittedDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            required
            aria-required="true"
          />
          {!hasStateApplicationDocuments && submittedDate && (
            <div className="text-xs text-text-warn mt-1">
              At least one State Application document is required when date is provided
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Completeness Review Due Date</label>
          <input
            type="date"
            value={completenessReviewDueDate ? formatDateForInput(completenessReviewDueDate) : ""}
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
          onClick={onFinish}
          disabled={!isFinishEnabled}
          size="small"
        >
          {finishing ? "Saving…" : "Finish"}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {isLocalDevelopment() && <TestingPanel />}

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
