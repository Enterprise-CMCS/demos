import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, formatDateForInput, parseInputDate } from "util/formatDate";
import { isLocalDevelopment } from "config/env";
import { Notice, NoticeVariant } from "components/notice";
import { differenceInCalendarDays } from "date-fns";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { CompletenessDocumentUploadDialog } from "./CompletenessDocumentUploadDialog";
import { DeclareIncompleteDialog } from "components/dialog";
import { CompletenessTestingPanel } from "./CompletenessTestingPanel";
import { PhaseStatusContext } from "../phase-selector/PhaseStatusContext";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-xs font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-xs text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex items-center gap-3`,
  actionsEnd: tw`ml-auto flex gap-3`,
};

const toInputDate = (d: Date) => formatDateForInput(d);

export const CompletenessPhase: React.FC = () => {
  const phaseStatusContext = React.useContext(PhaseStatusContext);
  const completenessMeta = phaseStatusContext?.phaseMetaLookup?.Completeness;
  const [noticeDueDate, setNoticeDueDate] = useState<string>(() => {
    return completenessMeta?.dueDate ? toInputDate(completenessMeta.dueDate) : "";
  });

  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isNoticeDismissed, setNoticeDismissed] = useState(false);
  const [mockDocuments, setMockDocuments] = useState<DocumentTableDocument[]>([]);
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>("");
  const [federalStartDate, setFederalStartDate] = useState<string>("");
  const [federalEndDate, setFederalEndDate] = useState<string>("");

  const completenessDocs = mockDocuments.filter(
    (doc) => doc.documentType === "Application Completeness Letter"
  );
  const hasDocs = completenessDocs.length > 0;

  // derive notice date and days from input string
  const noticeDueDateValue = React.useMemo(() => parseInputDate(noticeDueDate), [noticeDueDate]);
  const noticeDaysValue = React.useMemo(() => {
    if (!noticeDueDateValue) return null;
    return differenceInCalendarDays(noticeDueDateValue, new Date());
  }, [noticeDueDateValue]);

  // determine notice title/description from days
  const noticeTitle = React.useMemo(() => {
    if (noticeDaysValue === null) return null;
    if (noticeDaysValue < 0) {
      const daysPastDue = Math.abs(noticeDaysValue);
      return `${daysPastDue} Day${daysPastDue === 1 ? "" : "s"} Past Due`;
    }
    return `${noticeDaysValue} day${noticeDaysValue === 1 ? "" : "s"} left in Federal Comment Period`;
  }, [noticeDaysValue]);

  const formattedNoticeDate = noticeDueDateValue ? formatDate(noticeDueDateValue) : null;
  // TODO: update when we have real data
  const noticeDescription = formattedNoticeDate
    ? `This Amendment must be declared complete by ${formattedNoticeDate}`
    : undefined;

  // go from yellow to red at 1 day left.
  const isNoticeUrgent = noticeDaysValue !== null && noticeDaysValue <= 1;
  const noticeVariant: NoticeVariant = isNoticeUrgent ? "error" : "warning";
  const shouldRenderNotice = Boolean(!isNoticeDismissed && noticeDueDateValue && noticeTitle);

  React.useEffect(() => {
    if (!phaseStatusContext) return;
    phaseStatusContext.updatePhaseMeta("Completeness", {
      dueDate: noticeDueDateValue,
    });
  }, [phaseStatusContext, noticeDueDateValue]);

  const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
  const datesAreValid = !federalStartDate || !federalEndDate
    ? true
    : new Date(federalStartDate) <= new Date(federalEndDate);
  const canFinish = hasDocs && datesFilled && datesAreValid;
  const completenessStatus = phaseStatusContext?.phaseStatusLookup.Completeness;
  const markCompletenessFinished = () => {
    phaseStatusContext?.updatePhaseStatus("Completeness", "Completed");
    phaseStatusContext?.selectNextPhase("Completeness");
    setNoticeDismissed(true);
  };

  React.useEffect(() => {
    if (noticeDueDateValue) {
      setNoticeDismissed(false);
    }
  }, [noticeDueDateValue]);

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
        <div className={STYLES.actionsEnd}>
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
            disabled={!canFinish || completenessStatus === "Completed"}
            onClick={markCompletenessFinished}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {shouldRenderNotice && noticeTitle && noticeDueDateValue && (
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
          Medicaid.gov.
            </a>
          </p>

          <section className={STYLES.pane}>
            <div className={STYLES.grid}>
              <span aria-hidden className={STYLES.divider} />
              <UploadSection />
              <VerifyCompleteSection />
            </div>
          </section>

          {/* Minimal dialog wrapper; safe to remove when wired to real data */}
          <CompletenessDocumentUploadDialog
            isOpen={isUploadOpen}
            onClose={() => setUploadOpen(false)}
          />
          <DeclareIncompleteDialog
            isOpen={isDeclareIncompleteOpen}
            onClose={() => setDeclareIncompleteOpen(false)}
            onConfirm={(form) => console.log("Declare incomplete submitted", form)}
          />
        </div>
      )}
      {/* These are all wired up, to work correctly. Add api is as simple as setting these vars */}
      {isLocalDevelopment() && (
        <CompletenessTestingPanel
          onAddMockDoc={addMockDoc}
          completenessDocCount={completenessDocs.length}
          noticeDueDate={noticeDueDate}
          onNoticeDueDateChange={setNoticeDueDate}
          noticeDaysValue={noticeDaysValue}
          onResetNotice={() => setNoticeDismissed(false)}
        />
      )}
    </div>
  );
};
