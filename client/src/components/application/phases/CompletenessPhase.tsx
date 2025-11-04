import React, { useCallback, useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, parseInputDate, formatDateForServer } from "util/formatDate";
import { Notice, NoticeVariant } from "components/notice";
import { addDays, differenceInCalendarDays } from "date-fns";
import { gql, useMutation } from "@apollo/client";
import { CompletenessDocumentUploadDialog } from "components/dialog/document/CompletenessDocumentUploadDialog";
import { DeclareIncompleteDialog } from "components/dialog";
import {
  COMPLETENESS_PHASE_DATE_TYPES,
  getInputsForCompletenessPhase,
} from "components/application/dates/applicationDateQueries";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "../ApplicationWorkflow";
import { TZDate } from "@date-fns/tz";
import { useToast } from "components/toast";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";

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

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

const DATES_SUCCESS_MESSAGE = "Dates saved successfully.";
const PHASE_SAVED_SUCCESS_MESSAGE = "Dates and status saved successfully.";

export const getApplicationCompletenessFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const completenessPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Completeness"
  );
  const fedCommentStartDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period Start Date"
  );
  const fedCommentEndDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period End Date"
  );
  const stateDeemedCompleteDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "State Application Deemed Complete"
  );
  const applicationCompletenessDocument = demonstration?.documents.filter(
    (doc) => doc.documentType === "Application Completeness Letter"
  );

  return (
    <CompletenessPhase
      applicationId={demonstration.id}
      fedCommentStartDate={
        fedCommentStartDate?.dateValue ? formatDateForServer(fedCommentStartDate.dateValue) : ""
      }
      fedCommentEndDate={
        fedCommentEndDate?.dateValue ? formatDateForServer(fedCommentEndDate.dateValue) : ""
      }
      stateDeemedCompleteDate={
        stateDeemedCompleteDate?.dateValue
          ? formatDateForServer(stateDeemedCompleteDate.dateValue)
          : ""
      }
      applicationCompletenessDocument={applicationCompletenessDocument ?? []}
    />
  );
};

export interface CompletenessPhaseProps {
  applicationId: string;
  fedCommentStartDate?: string;
  fedCommentEndDate?: string;
  stateDeemedCompleteDate?: string;
  applicationCompletenessDocument: ApplicationWorkflowDocument[];
}

export const CompletenessPhase = ({
  applicationId,
  fedCommentStartDate,
  fedCommentEndDate,
  stateDeemedCompleteDate,
  applicationCompletenessDocument,
}: CompletenessPhaseProps) => {
  const { showSuccess, showError } = useToast();

  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [federalStartDate, setFederalStartDate] = useState<string>(fedCommentStartDate ?? "");
  const [federalEndDate, setFederalEndDate] = useState<string>(fedCommentEndDate ?? "");
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>(
    stateDeemedCompleteDate ?? ""
  );

  const [completenessDocs, setCompletenessDocs] = useState<ApplicationWorkflowDocument[]>(
    applicationCompletenessDocument
  );

  const [setApplicationDateMutation] = useMutation(gql`
    mutation SetApplicationDate($input: SetApplicationDateInput!) {
      setApplicationDate(input: $input) {
        __typename
      }
    }
  `);

  const { setPhaseStatus: completeCompletenessPhase } = useSetPhaseStatus({
    applicationId: applicationId,
    phaseName: "Completeness",
    phaseStatus: "Completed",
  });

  const { setPhaseStatus: setCompletenessIncompleted } = useSetPhaseStatus({
    applicationId: applicationId,
    phaseName: "Completeness",
    phaseStatus: "Incomplete",
  });

  // Automatically set federal comment period dates based on state deemed complete date
  useEffect(() => {
    if (!stateDeemedComplete) {
      return;
    }

    const startDate = parseInputDate(stateDeemedComplete);
    if (startDate) {
      const endDate = addDays(stateDeemedComplete, FEDERAL_COMMENT_PERIOD_DAYS);

      setFederalStartDate(formatDateForServer(startDate));
      setFederalEndDate(formatDateForServer(endDate));
    }
  }, [stateDeemedComplete]);

  const finishIsEnabled = () => {
    const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
    const datesAreValid =
      federalStartDate && federalEndDate
        ? true
        : new Date(federalStartDate) <= new Date(federalEndDate);

    return completenessDocs.length > 0 && datesFilled && datesAreValid;
  };

  const getDateValues = useCallback(() => {
    const toEasternStartOfDay = (value: string): Date | null =>
      value ? new TZDate(`${value}T00:00:00`, "America/New_York") : null;
    const toEasternEndOfDay = (value: string): Date | null =>
      value ? new TZDate(`${value}T23:59:59.999`, "America/New_York") : null;

    return {
      "State Application Deemed Complete": toEasternStartOfDay(stateDeemedComplete),
      "Federal Comment Period Start Date": toEasternStartOfDay(federalStartDate),
      "Federal Comment Period End Date": toEasternEndOfDay(federalEndDate),
      "Completeness Completion Date": toEasternStartOfDay(stateDeemedComplete),
    } as Record<(typeof COMPLETENESS_PHASE_DATE_TYPES)[number], Date | null>;
  }, [stateDeemedComplete, federalStartDate, federalEndDate]);

  const saveDates = async () => {
    const dateValues = getDateValues();
    const inputs = getInputsForCompletenessPhase(applicationId, dateValues);

    try {
      await Promise.all(
        inputs.map(async (input) => {
          await setApplicationDateMutation({
            variables: {
              input: input,
            },
            refetchQueries: [GET_WORKFLOW_DEMONSTRATION_QUERY],
          });
        })
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
      console.error("Error saving Phase: ", error);
    }
  };

  const handleFinishCompleteness = async () => {
    await saveDates();
    await completeCompletenessPhase();
  };

  const handleDeclareIncomplete = async () => {
    await setCompletenessIncompleted();
  };

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the Signed Completeness Letter</p>
      {/* TODO: DOC NOT WORKING - documentPendingUpload.create - seeded to compensate */}
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
              onClick={() =>
                setCompletenessDocs((docs) => docs.filter((document) => document.id !== doc.id))
              }
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
      <h4 id="completeness-verify-title" className={STYLES.title}>
        Step 2 - VERIFY/COMPLETE
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
            onChange={(event) => {
              setStateDeemedComplete(event.target.value);
            }}
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
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-start"
            data-testid="federal-comment-period-start"
            readOnly
            disabled
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
            className="w-full border border-border-fields px-1 py-1 text-sm rounded"
            id="federal-comment-period-end"
            data-testid="federal-comment-period-end"
            readOnly
            disabled
          />
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
            onClick={async () => {
              await saveDates();
              showSuccess(DATES_SUCCESS_MESSAGE);
            }}
          >
            Save For Later
          </SecondaryButton>
          <Button
            name="finish-completeness"
            size="small"
            disabled={!finishIsEnabled()}
            onClick={async () => {
              await handleFinishCompleteness();
              showSuccess(PHASE_SAVED_SUCCESS_MESSAGE);
            }}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  const CompletenessNotice = () => {
    const [isNoticeDismissed, setNoticeDismissed] = useState(false);

    if (federalEndDate) {
      const noticeDaysValue = differenceInCalendarDays(federalEndDate, new Date());

      // determine notice title/description from days
      const getNoticeTitle = () => {
        const daysLeft = noticeDaysValue;
        if (daysLeft < 0) {
          const daysPastDue = Math.abs(daysLeft);
          return `${daysPastDue} Day${daysPastDue === 1 ? "" : "s"} Past Due`;
        }
        return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in Federal Comment Period`;
      };

      const formattedNoticeDate = formatDateForServer(federalEndDate);
      const noticeDescription = formattedNoticeDate
        ? `This Amendment must be declared complete by ${formattedNoticeDate}`
        : undefined;

      // go from yellow to red at 1 day left.
      const noticeVariant: NoticeVariant = noticeDaysValue <= 1 ? "error" : "warning";
      const shouldRenderNotice = Boolean(!isNoticeDismissed);

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
    }
  };

  return (
    <div>
      <CompletenessNotice />
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
            applicationId={applicationId}
          />

          <DeclareIncompleteDialog
            isOpen={isDeclareIncompleteOpen}
            onClose={() => setDeclareIncompleteOpen(false)}
            onConfirm={async () => {
              await handleDeclareIncomplete();
              setDeclareIncompleteOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};
