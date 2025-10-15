import React, { useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, parseInputDate } from "util/formatDate";
import { Notice, NoticeVariant } from "components/notice";
import { differenceInCalendarDays } from "date-fns";

import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { CompletenessDocumentUploadDialog } from "./CompletenessDocumentUploadDialog";
import { DeclareIncompleteDialog } from "components/dialog";

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

const CompletenessNotice = ({ noticeDueDate }: { noticeDueDate: string }) => {
  const [isNoticeDismissed, setNoticeDismissed] = useState(false);
  const noticeDueDateValue = parseInputDate(noticeDueDate);
  const noticeDaysValue = differenceInCalendarDays(noticeDueDateValue, new Date());

  // determine notice title/description from days
  const getNoticeTitle = () => {
    const daysLeft = noticeDaysValue;
    if (daysLeft < 0) {
      const daysPastDue = Math.abs(daysLeft);
      return `${daysPastDue} Day${daysPastDue === 1 ? "" : "s"} Past Due`;
    }
    return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in Federal Comment Period`;
  };

  const formattedNoticeDate = noticeDueDateValue ? formatDate(noticeDueDateValue) : null;
  // TODO: update when we have real data
  const noticeDescription = formattedNoticeDate
    ? `This Amendment must be declared complete by ${formattedNoticeDate}`
    : undefined;

  // go from yellow to red at 1 day left.
  const noticeVariant: NoticeVariant = noticeDaysValue <= 1 ? "error" : "warning";
  const shouldRenderNotice = Boolean(!isNoticeDismissed && noticeDueDateValue);

  if (shouldRenderNotice) {
    return (
      <Notice
        variant={noticeVariant}
        title={getNoticeTitle()}
        description={noticeDescription}
        onDismiss={() => setNoticeDismissed(true)}
        className="mb-6"
      />
    );
  }
};

export const CompletenessPhase: React.FC = () => {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [completenessDocs, setCompletenessDocs] = useState<DocumentTableDocument[]>([]);
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>("");
  const [federalStartDate, setFederalStartDate] = useState<string>("");
  const [federalEndDate, setFederalEndDate] = useState<string>("");

  const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
  const datesAreValid =
    !federalStartDate || !federalEndDate
      ? true
      : new Date(federalStartDate) <= new Date(federalEndDate);
  const canFinish = completenessDocs.length > 0 && datesFilled && datesAreValid;

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the Signed Completeness Letter</p>

      <SecondaryButton onClick={() => setUploadOpen(true)} size="small" name="open-upload">
        Upload
        <ExportIcon />
      </SecondaryButton>

      <div className={STYLES.list}>
        {completenessDocs.map((doc) => (
          <div key={doc.id} className={STYLES.fileRow}>
            <div>
              <div className="font-medium">{doc.name}</div>
              <div className={STYLES.fileMeta}>
                {doc.createdAt ? formatDate(doc.createdAt) : "--/--/----"}
              </div>
            </div>
            <button
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
              onClick={() => setCompletenessDocs((docs) => docs.filter((d) => d.id !== doc.id))}
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
          <label
            className="block text-sm font-bold mb-1"
            htmlFor="state-application-deemed-complete"
          >
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
            disabled={!canFinish}
            onClick={() => console.log("Finish completeness phase")}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <CompletenessNotice noticeDueDate={"2025-01-01"} />

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
            Completeness Checklist – Find completeness guidelines online at{" "}
            <a
              className="text-blue-700 underline"
              href="https://www.medicaid.gov"
              target="_blank"
              rel="noreferrer"
            >
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
    </div>
  );
};
