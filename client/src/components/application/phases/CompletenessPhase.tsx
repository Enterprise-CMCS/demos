import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";
import { isLocalDevelopment } from "config/env";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { CompletenessUploadDialog } from "components/dialog/document/CompletenessUploadDialog";

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

// A minimal starter for the Completeness phase UI with two sections
export const CompletenessPhase: React.FC = () => {
  const [isUploadOpen, setUploadOpen] = useState(false);

  // local-only state for a basic starting point
  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>("");
  const [federalStartDate, setFederalStartDate] = useState<string>("");
  const [federalEndDate, setFederalEndDate] = useState<string>("");

  const completenessDocs = mockDocuments.filter(
    (d) => d.documentType === "Application Completeness Letter"
  );
  const hasDocs = completenessDocs.length > 0;

  const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
  const datesAreValid = !federalStartDate || !federalEndDate
    ? true
    : new Date(federalStartDate) <= new Date(federalEndDate);
  const canFinish = hasDocs && datesFilled && datesAreValid;

  // lightweight helpers to mock document activity while wiring up UI
  const addMockDoc = () => {
    setMockDocuments((prev) => [
      ...prev,
      {
        id: `mock-${Date.now()}`,
        title: `Signed Completeness Letter ${prev.length + 1}`,
        description: "Mock file for layout",
        documentType: "Application Completeness Letter",
        createdAt: new Date(),
        owner: { fullName: "Test User" },
      },
    ]);
  };
  const removeMockDoc = (id: string) => setMockDocuments((p) => p.filter((d) => d.id !== id));

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the Signed Completeness Letter</p>

      <SecondaryButton onClick={() => setUploadOpen(true)} size="small" name="open-upload">
        <span className="flex items-center gap-1">
          Upload
          <ExportIcon />
        </span>
      </SecondaryButton>

      <div className={STYLES.list}>
        {completenessDocs.length === 0 && (
          <div className="text-sm text-text-placeholder">No documents yet.</div>
        )}
        {completenessDocs.map((doc) => (
          <div key={doc.id} className={STYLES.fileRow}>
            <div>
              <div className="font-medium">{doc.title}</div>
              <div className={STYLES.fileMeta}>{doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}</div>
            </div>
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => (doc.id.startsWith("mock-") ? removeMockDoc(doc.id) : console.log("delete", doc.id))}
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
    <div aria-labelledby="completeness-verify-title">
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Complete</div>
      <h4 id="completeness-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document(s) are uploaded/accurate and that all required fields are filled.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            State Application Deemed Complete
          </label>
          <input
            type="date"
            value={stateDeemedComplete}
            onChange={(e) => setStateDeemedComplete(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period Start Date
          </label>
          <input
            type="date"
            value={federalStartDate}
            onChange={(e) => setFederalStartDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period End Date
          </label>
          <input
            type="date"
            value={federalEndDate}
            onChange={(e) => setFederalEndDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          />
          {federalStartDate && federalEndDate && !datesAreValid && (
            <div className="text-xs text-text-warn mt-1">End date must be after start date</div>
          )}
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton name="declare-incomplete" size="small" disabled>
          Declare Incomplete
        </SecondaryButton>
        <SecondaryButton
          name="save-for-later"
          size="small"
          onClick={() => console.log("Saved draft of completeness phase")}
        >
          Save For Later
        </SecondaryButton>
        <Button name="finish-completeness" size="small" disabled={!canFinish} onClick={() => console.log("Finish completeness phase")}>
          Finish
        </Button>
      </div>
    </div>
  );

  // Simple testing aid while building the UI (dev only)
  const TestingPanel = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex gap-2 flex-wrap items-center text-xs">
        <button
          onClick={addMockDoc}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Add Mock Completeness Doc
        </button>
        <span className="text-gray-600">Docs: {completenessDocs.length}</span>
      </div>
    </div>
  );

  return (
    <div>
      {isLocalDevelopment() && <TestingPanel />}

      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">COMPLETENESS</h3>
      <p className="text-sm text-text-placeholder mb-4">
        Completeness Checklist – Find completeness guidelines online at
        {" "}
        <a className="text-blue-700 underline" href="https://www.medicaid.gov" target="_blank" rel="noreferrer">
          Medicaid.gov
        </a>
        .
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <UploadSection />
          <VerifyCompleteSection />
        </div>
      </section>

      {/* Minimal dialog wrapper; safe to remove when wired to real data */}
      <CompletenessUploadDialog isOpen={isUploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
};
