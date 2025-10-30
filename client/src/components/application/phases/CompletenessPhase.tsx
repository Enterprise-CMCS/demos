import React, { useCallback, useEffect, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon, DeleteIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, parseInputDate, formatDateForServer } from "util/formatDate";
import { Notice, NoticeVariant } from "components/notice";
import { differenceInCalendarDays } from "date-fns";
import { useApolloClient, gql } from "@apollo/client";
import { CompletenessDocumentUploadDialog } from "./CompletenessDocumentUploadDialog";
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

const DATES_SUCCESS_MESSAGE = "Dates saved successfully.";
const PHASE_SAVED_SUCCESS_MESSAGE = "Dates and status saved successfully.";
const FAIL_MESSAGE = "Dates and status not saved.";

const SET_APPLICATION_DATE_MUTATION = gql`
  mutation SetApplicationDate($input: SetApplicationDateInput!) {
    setApplicationDate(input: $input) {
      __typename
      ... on Demonstration {
        id
      }
      ... on Amendment {
        id
      }
      ... on Extension {
        id
      }
    }
  }
`;

const SET_PHASE_STATUS_MUTATION = gql`
  mutation SetCompletenessPhaseStatus($input: SetApplicationPhaseStatusInput!) {
    setApplicationPhaseStatus(input: $input) {
      id
      currentPhaseName
      phases {
        phaseName
        phaseStatus
        phaseDates {
          dateType
          dateValue
        }
      }
    }
  }
`;

const CompletenessNotice = ({
  noticeDueDate,
  stateDeemedComplete,
}: {
  noticeDueDate: string,
  stateDeemedComplete: boolean
}) => {
  useEffect(() => {
    setNoticeDismissed(stateDeemedComplete === true);
  }, [stateDeemedComplete]);
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    stateDeemedComplete === true
  );

  useEffect(() => {
    setNoticeDismissed(stateDeemedComplete);
  }, [stateDeemedComplete]);

  const noticeDueDateValue = parseInputDate(noticeDueDate);

  if (!noticeDueDateValue || isNaN(noticeDueDateValue.getTime())) {
    return null;
  }

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

  const formattedNoticeDate = formatDate(noticeDueDateValue);
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
};

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
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>(
    stateDeemedCompleteDate ?? ""
  );
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isDeclareIncompleteOpen, setDeclareIncompleteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [federalStartDate, setFederalStartDate] = useState<string>(
    fedCommentStartDate ?? ""
  );
  const [federalEndDate, setFederalEndDate] = useState<string>(
    fedCommentEndDate ?? ""
  );

  const [completenessDocs, setCompletenessDocs] = useState<ApplicationWorkflowDocument[]>(
    applicationCompletenessDocument
  );

  const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
  const datesAreValid =
    !federalStartDate || !federalEndDate
      ? true
      : new Date(federalStartDate) <= new Date(federalEndDate);

  const canFinish = completenessDocs.length > 0 && datesFilled && datesAreValid;
  const apolloClient = useApolloClient();

  const updatePhaseStatus = useCallback(
    async (phaseStatus: "Completed" | "Incomplete") => {
      try {
        await apolloClient.mutate({
          mutation: SET_PHASE_STATUS_MUTATION,
          variables: {
            input: {
              applicationId,
              phaseName: "Completeness",
              phaseStatus,
            },
          },
          refetchQueries: [
            {
              query: GET_WORKFLOW_DEMONSTRATION_QUERY,
              variables: { id: applicationId },
            },
          ],
        });
        showSuccess(PHASE_SAVED_SUCCESS_MESSAGE);
      } catch (error) {
        showError(FAIL_MESSAGE);
        console.error("Error updating phase status:", error);
      }
    },
    [apolloClient, applicationId, showError, showSuccess]
  );

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

  const saveTheDatesOnly = useCallback(async (options?: { suppressSuccessToast?: boolean }) => {
    const dateValues = getDateValues();
    const inputs = getInputsForCompletenessPhase(applicationId, dateValues);

    try {
      await Promise.all(
        inputs.map(async (input) => {
          await apolloClient.mutate({
            mutation: SET_APPLICATION_DATE_MUTATION,
            variables: { input },
          });
        })
      );
      if (!options?.suppressSuccessToast) {
        showSuccess(DATES_SUCCESS_MESSAGE);
      }
    } catch (error) {
      showError(FAIL_MESSAGE);
      console.error("Error executing mutation:", error);
    }
  }, [apolloClient, applicationId, getDateValues, showError, showSuccess]);

  const handleFinishCompleteness = useCallback(async () => {
    await saveTheDatesOnly({ suppressSuccessToast: true });
    await updatePhaseStatus("Completed");
  }, [saveTheDatesOnly, updatePhaseStatus]);

  const handleDeclareIncomplete = useCallback(async () => {
    await updatePhaseStatus("Incomplete");
  }, [updatePhaseStatus]);

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the Signed Completeness Letter</p>
      {/* TODO: DEBUG DOC NOT WORKING - prisma().documentPendingUpload.create error */}
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
                setCompletenessDocs(
                  (docs) => docs.filter((document) => document.id !== doc.id)
                )
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
            onChange={(event) => setFederalStartDate(event.target.value)}
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
            onClick={async () => {
              await saveTheDatesOnly();
            }}
          >
            Save For Later
          </SecondaryButton>
          <Button
            name="finish-completeness"
            size="small"
            disabled={!canFinish}
            onClick={async () => {
              await handleFinishCompleteness();
            }}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <CompletenessNotice
        noticeDueDate={federalEndDate ?? ""}
        stateDeemedComplete={!!stateDeemedComplete}
      />

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
