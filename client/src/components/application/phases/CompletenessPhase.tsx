import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate } from "util/formatDate";
import { isLocalDevelopment } from "config/env";
import { Notice, NoticeVariant } from "components/notice";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { CompletenessUploadDialog } from "components/dialog/document/CompletenessUploadDialog";
import { DeclareIncompleteDialog } from "components/dialog";
import { CompletenessTestingPanel } from "./CompletenessTestingPanel";
import { PhaseStatusContext } from "../phase-selector/PhaseStatusContext";

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
  actions: tw`mt-8 flex justify-end gap-3 text-left`,
};

// A minimal starter for the Completeness phase UI with two sections
export const CompletenessPhase: React.FC = () => {
  const phaseStatusContext = React.useContext(PhaseStatusContext);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isNoticeDismissed, setNoticeDismissed] = useState(false);
  const [noticeDaysRemaining, setNoticeDaysRemaining] = useState<string>("29");
  const [noticeDueDate, setNoticeDueDate] = useState<string>("2025-09-19");

  // local-only state for a basic starting point
  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>("");
  const [federalStartDate, setFederalStartDate] = useState<string>("");
  const [federalEndDate, setFederalEndDate] = useState<string>("");

  const completenessDocs = mockDocuments.filter(
    (doc) => doc.documentType === "Application Completeness Letter"
  );
  const hasDocs = completenessDocs.length > 0;

  const trimmedNoticeDays = noticeDaysRemaining.trim();
  const parsedNoticeDays = trimmedNoticeDays === "" ? NaN : Number.parseInt(trimmedNoticeDays, 10);
  const noticeDaysValue = Number.isNaN(parsedNoticeDays) ? null : parsedNoticeDays;

  const noticeTitle = (() => {
    if (noticeDaysValue === null) return "Federal Comment Period notice";
    if (noticeDaysValue < 0) {
      const daysPastDue = Math.abs(noticeDaysValue);
      return `${daysPastDue} Day${daysPastDue === 1 ? "" : "s"} Past Due`;
    }
    return `${noticeDaysValue} day${noticeDaysValue === 1 ? "" : "s"} left in Federal Comment Period`;
  })();

  const dueDateCandidate = noticeDueDate ? new Date(noticeDueDate) : undefined;
  const isDueDateValid = dueDateCandidate instanceof Date && !Number.isNaN(dueDateCandidate.getTime());
  const formattedNoticeDate = isDueDateValid ? formatDate(dueDateCandidate) : null;
  const noticeDescription = formattedNoticeDate
    ? `This Amendment must be declared complete by ${formattedNoticeDate}`
    : "Add a mock due date in the testing panel to update this message.";
  // go from yellow to red at 1 day left.
  const noticeVariant: NoticeVariant = noticeDaysValue !== null && noticeDaysValue <= 1 ? "error" : "warning";

  const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
  const datesAreValid = !federalStartDate || !federalEndDate
    ? true
    : new Date(federalStartDate) <= new Date(federalEndDate);
  const canFinish = hasDocs && datesFilled && datesAreValid;
  const completenessStatus = phaseStatusContext?.phaseStatusLookup.Completeness;
  const markCompletenessFinished = () => {
    phaseStatusContext?.updatePhaseStatus("Completeness", "completed");
    setNoticeDismissed(true);
  };

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
        owner: { person: { fullName: "Test User" } },
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
      <div className={STYLES.stepEyebrow}>Step 2 - Verify/Completeeee</div>
      <h4 id="completeness-verify-title" className={STYLES.title}>
        VERIFY/COMPLETE
      </h4>
      <p className={STYLES.helper}>
        Verify that the document(s) are uploaded/accurate and that all required fields are filled.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-bold mb-1" htmlFor="state-application-deemed-complete">
            <span className="text-text-warn mr-1">*</span>
            State Application Deemed Complete
          </label>
          <input
            type="date"
            value={stateDeemedComplete}
            onChange={(e) => setStateDeemedComplete(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="state-application-deemed-complete"
            data-testid="state-application-deemed-complete"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1" htmlFor="federal-comment-period-start">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period Start Date
          </label>
          <input
            type="date"
            value={federalStartDate}
            onChange={(e) => setFederalStartDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-start"
            data-testid="federal-comment-period-start"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1" htmlFor="federal-comment-period-end">
            <span className="text-text-warn mr-1">*</span>
            Federal Comment Period End Date
          </label>
          <input
            type="date"
            value={federalEndDate}
            onChange={(e) => setFederalEndDate(e.target.value)}
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-end"
            data-testid="federal-comment-period-end"
          />
          {federalStartDate && federalEndDate && !datesAreValid && (
            <div className="text-xs text-text-warn mt-1">End date must be after start date</div>
          )}
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name="declare-incomplete"
          size="small"
          onClick={() => setDeclareIncompleteOpen(true)}
        >
          Declare Incomplete
        </SecondaryButton>
        <SecondaryButton
          name="save-for-later"
          size="small"
          onClick={() => console.log("Saved draft of completeness phase")}
        >
          Save For Later
        </SecondaryButton>
        <Button
          name="finish-completeness"
          size="small"
          disabled={!canFinish || completenessStatus === "completed"}
          onClick={markCompletenessFinished}
        >
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {!isNoticeDismissed && (
        <Notice
          variant={noticeVariant}
          title={noticeTitle}
          description={noticeDescription}
          onDismiss={() => setNoticeDismissed(true)}
          className="mb-6"
        />
      )}
      <button
        className="flex items-center gap-2 mb-2 text-brand font-bold text-[22px] tracking-wide focus:outline-none"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-controls="completeness-phase-content"
        data-testid="toggle-completeness"
      >
      COMPLETENESS
      </button>
      {!collapsed && (
        <div id="completeness-phase-content">
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
          <CompletenessUploadDialog
            isOpen={isUploadOpen}
            onClose={() => setUploadOpen(false)}
            // onUploaded={addMockDoc}
          />
          <DeclareIncompleteDialog
            isOpen={isDeclareIncompleteOpen}
            onClose={() => setDeclareIncompleteOpen(false)}
            onConfirm={(form) => console.log("Declare incomplete submitted", form)}
          />
        </div>
      )}
      {/* Since this is pretty handy (pre-api hookup), let's make it easy to separate */}
      {isLocalDevelopment() && (
        <CompletenessTestingPanel
          onAddMockDoc={addMockDoc}
          completenessDocCount={completenessDocs.length}
          noticeDaysRemaining={noticeDaysRemaining}
          onNoticeDaysChange={setNoticeDaysRemaining}
          noticeDueDate={noticeDueDate}
          onNoticeDueDateChange={setNoticeDueDate}
          noticeDaysValue={noticeDaysValue}
          onResetNotice={() => setNoticeDismissed(false)}
        />
      )}
    </div>
  );
};
