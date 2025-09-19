import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ConceptPreSubmissionUploadDialog } from "components/dialog/document/ConceptPreSubmissionUploadDialog";
import { ChevronRightIcon, DeleteIcon, ExportIcon } from "components/icons";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { isLocalDevelopment } from "config/env";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";

import { gql, useMutation } from "@apollo/client";

const COMPLETE_CONCEPT_PHASE = gql`
  mutation CompleteConceptPhase($input: CompleteConceptPhaseInput!) {
    completeConceptPhase(input: $input) {
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

const DEMONSTRATION_TYPE_OPTIONS: Option[] = [
  { label: "Section 1115", value: "1115" },
  { label: "Section 1915(b)", value: "1915b" },
  { label: "Section 1915(c)", value: "1915c" },
];

export const ConceptPhase: React.FC<Props> = ({
  demonstrationId = "default-demo-id",
  documents = [],
  onDocumentsRefetch,
}) => {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [dateSubmitted, setDateSubmitted] = useState<string>("");
  const [demoType, setDemoType] = useState<string>("");

  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);

  const testDocuments = documents.length > 0 ? documents : mockDocuments;

  const [completePhase, { loading: finishing }] = useMutation(COMPLETE_CONCEPT_PHASE, {
    onCompleted: () => onDocumentsRefetch?.(),
  });

  const preSubmissionDocuments = testDocuments.filter(
    (doc) =>
      doc.documentType === "Pre-Submission" ||
      doc.title?.toLowerCase().includes("pre-submission") ||
      doc.description?.toLowerCase().includes("pre-submission")
  );

  React.useEffect(() => {
    if (preSubmissionDocuments.length > 0 && !dateSubmitted) {
      const latestDoc = preSubmissionDocuments[preSubmissionDocuments.length - 1];
      if (latestDoc.createdAt) {
        const uploadDate = new Date(latestDoc.createdAt);
        const year = uploadDate.getFullYear();
        const month = String(uploadDate.getMonth() + 1).padStart(2, "0");
        const day = String(uploadDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        setDateSubmitted(formattedDate);
      }
    }
  }, [preSubmissionDocuments, dateSubmitted]);

  const hasPreSubmissionDocuments = preSubmissionDocuments.length > 0;
  const hasDatePopulated = dateSubmitted.length > 0;
  const hasAnyActivity = hasPreSubmissionDocuments || hasDatePopulated;

  const isFinishEnabled = hasPreSubmissionDocuments && hasDatePopulated && !finishing;
  const isSkipEnabled = !hasAnyActivity;

  const onFinish = async () => {
    if (!hasPreSubmissionDocuments) {
      alert("At least one Pre-Submission document is required.");
      return;
    }
    if (!hasDatePopulated) {
      alert("Pre-Submission Document Submitted Date is required.");
      return;
    }

    await completePhase({
      variables: {
        input: {
          demonstrationId,
          dateSubmitted,
          demonstrationTypeRequested: demoType,
        },
      },
    });
  };

  const onSkip = () => {
    // TODO: Implement skip logic - navigate to State Application phase
    // This should mark the phase as "Skipped" and navigate to the next phase
    console.log("Skipping Concept Phase - navigate to State Application");
  };

  // TEMP: Mock document helpers for testing - remove when upload is implemented
  const addMockDocument = () => {
    const newDoc: DocumentTableDocument = {
      id: `mock-${Date.now()}`,
      title: `Pre-Submission Document ${mockDocuments.length + 1}`,
      description: "Mock pre-submission document for testing",
      documentType: "Pre-Submission",
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
          Add Mock Pre-Submission Doc
        </button>
        <button
          onClick={clearAllMockDocuments}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear All Mock Docs
        </button>
        <span className="text-xs text-gray-600 self-center">
          Mock docs: {mockDocuments.length} | Pre-Submission docs: {preSubmissionDocuments.length}
        </span>
      </div>
      <div className="mt-2 text-xs text-yellow-700">
        Use these buttons to test the validation logic without actual file upload.
      </div>
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
        <strong>Current State:</strong>
        <br />• Has Pre-Submission Docs: {hasPreSubmissionDocuments ? "✅ Yes" : "❌ No"}
        <br />• Date Populated: {hasDatePopulated ? "✅ Yes" : "❌ No"}{" "}
        {dateSubmitted && `(${dateSubmitted})`}
        <br />• Any Activity: {hasAnyActivity ? "✅ Yes" : "❌ No"}
        <br />• Finish Enabled: {isFinishEnabled ? "✅ Yes" : "❌ No"}
        <br />• Skip Enabled: {isSkipEnabled ? "✅ Yes" : "❌ No"}
      </div>
    </div>
  );

  const UploadSection = () => (
    <div aria-labelledby="concept-upload-title">
      <h4 id="concept-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>
        Upload the Pre-Submission Document describing your demonstration.
      </p>

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
        {preSubmissionDocuments.length === 0 && (
          <div className="text-sm text-text-placeholder">No documents yet.</div>
        )}
        {preSubmissionDocuments.map((doc) => (
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
          <label className="block text-sm font-bold mb-1">
            {hasPreSubmissionDocuments && <span className="text-text-warn mr-1">*</span>}
            Pre-Submission Document Submitted Date
          </label>
          <input
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
          <span className="flex items-center gap-1">
            Skip
            <ChevronRightIcon />
          </span>
        </SecondaryButton>
        <Button
          name="button-finish-concept"
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

      <ConceptPreSubmissionUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        bundleId={demonstrationId}
      />
    </div>
  );
};
