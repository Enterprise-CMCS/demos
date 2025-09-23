import React, { useState } from "react";

import {
  Button,
  SecondaryButton,
} from "components/button";
import {
  StateApplicationUploadDialog,
} from "components/dialog/document/StateApplicationUploadDialog";
import {
  DeleteIcon,
  ExportIcon,
} from "components/icons";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { isLocalDevelopment } from "config/env";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";

import {
  gql,
  useMutation,
} from "@apollo/client";

const COMPLETE_STATE_APPLICATION_PHASE = gql`
  mutation CompleteStateApplicationPhase($input: CompleteStateApplicationPhaseInput!) {
    completeStateApplicationPhase(input: $input) {
      id
      success
    }
  }
`;

type Props = {
  demonstrationId?: string;
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

// Utility function to add 15 calendar days to a date
const addCalendarDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Format date as YYYY-MM-DD for input fields
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const StateApplicationPhase: React.FC<Props> = ({
  demonstrationId = "default-demo-id",
  documents = [],
  onDocumentsRefetch,
}) => {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string>("");

  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);

  const testDocuments = documents.length > 0 ? documents : mockDocuments;

  const [completePhase, { loading: finishing }] = useMutation(COMPLETE_STATE_APPLICATION_PHASE, {
    onCompleted: () => onDocumentsRefetch?.(),
  });

  const stateApplicationDocuments = testDocuments.filter(
    (doc) =>
      doc.documentType === "State Application" ||
      doc.title?.toLowerCase().includes("state application") ||
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
  const completenessReviewDueDate = hasSubmittedDate
    ? addCalendarDays(new Date(submittedDate), 15)
    : null;

  const isFinishEnabled = hasStateApplicationDocuments && hasSubmittedDate && !finishing;

  const onFinish = async () => {
    if (!hasStateApplicationDocuments) {
      alert("At least one State Application document is required.");
      return;
    }
    if (!hasSubmittedDate) {
      alert("State Application Submitted Date is required.");
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

  // TEMP: Mock document helpers for testing - remove when upload is implemented
  const addMockDocument = () => {
    const newDoc: DocumentTableDocument = {
      id: `mock-${Date.now()}`,
      title: `State Application Document ${mockDocuments.length + 1}`,
      description: "Mock state application document for testing",
      documentType: "State Application",
      createdAt: new Date(),
      owner: { person: { fullName: "Test User" } },
    };
    setMockDocuments((prev) => [...prev, newDoc]);
  };

  const removeMockDocument = (docId: string) => {
    setMockDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const clearAllMockDocuments = () => {
    setMockDocuments([]);
  };

  // Testing Panel Component (Development Only)
  const TestingPanel = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="text-sm font-bold text-yellow-800 mb-2">Testing Panel (Development Only)</h4>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={addMockDocument}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Add Mock State Application Doc
        </button>
        <button
          onClick={clearAllMockDocuments}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear All Mock Docs
        </button>
        <span className="text-xs text-gray-600 self-center">
          Mock docs: {mockDocuments.length} | State Application docs:{" "}
          {stateApplicationDocuments.length}
        </span>
      </div>
      <div className="mt-2 text-xs text-yellow-700">
        Use these buttons to test the validation logic without actual file upload.
      </div>
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
        <strong>Current State:</strong>
        <br />• Has State Application Docs: {hasStateApplicationDocuments ? "✅ Yes" : "❌ No"}
        <br />• Submitted Date: {hasSubmittedDate ? "✅ Yes" : "❌ No"}{" "}
        {submittedDate && `(${submittedDate})`}
        <br />• Completeness Review Due: {completenessReviewDueDate ? "✅ Yes" : "❌ No"}{" "}
        {completenessReviewDueDate && `(${formatDateForInput(completenessReviewDueDate)})`}
        <br />• Finish Enabled: {isFinishEnabled ? "✅ Yes" : "❌ No"}
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
        <span className="flex items-center gap-1">
          Upload
          <ExportIcon />
        </span>
      </SecondaryButton>

      <div className={STYLES.list}>
        {stateApplicationDocuments.length === 0 && (
          <div className="text-sm text-text-placeholder">No documents yet.</div>
        )}
        {stateApplicationDocuments.map((doc) => (
          <div key={doc.id} className={STYLES.fileRow}>
            <div>
              <div className="font-medium">{doc.title}</div>
              <div className={STYLES.fileMeta}>
                {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
                {doc.description ? ` • ${doc.description}` : ""}
              </div>
            </div>
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => {
                if (doc.id.startsWith("mock-")) {
                  removeMockDocument(doc.id);
                } else {
                  // TODO: wire to RemoveDocumentDialog for real documents
                  console.log("Delete document:", doc.id);
                }
              }}
              aria-label={`Delete ${doc.title}`}
              title={`Delete ${doc.title}`}
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

      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">STATE APPLICATION</h3>
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

      <StateApplicationUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        bundleId={demonstrationId}
      />
    </div>
  );
};
