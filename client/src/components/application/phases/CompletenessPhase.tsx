import React, { useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import {
  formatDate,
  formatDateForServer,
  getTodayEst,
} from "util/formatDate";
import {
  addDays,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";
import { useToast } from "components/toast";
import { DocumentList } from "./sections";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { ApplicationDateInput, UploadDocumentInput } from "demos-server";
import { useDialog } from "components/dialog/DialogContext";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";
import { Notice, NoticeVariant } from "components/notice/Notice";

const STYLES = {
  pane: tw`bg-white`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  stepEyebrow: tw`text-[12px] font-semibold uppercase tracking-wide text-text-placeholder mb-2`,
  title: tw`text-xl font-semibold mb-2`,
  helper: tw`text-sm text-text-placeholder mb-2`,
  list: tw`mt-4 space-y-3`,
  fileRow: tw`bg-surface-secondary border border-border-fields px-3 py-2 flex items-center justify-between`,
  fileMeta: tw`text-[12px] text-text-placeholder mt-0.5`,
  actions: tw`mt-8 flex items-center gap-3`,
  actionsEnd: tw`ml-auto flex gap-3`,
};

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

const getFederalCommentPeriodDates = (stateDate: string) => {
  if (!stateDate) return { fedStartDate: null, fedEndDate: null };

  const parsedStateDate = parseISO(stateDate);
  const fedStartDate = addDays(parsedStateDate, 1);
  const fedEndDate = addDays(parsedStateDate, 1 + FEDERAL_COMMENT_PERIOD_DAYS);

  return { fedStartDate, fedEndDate };
};

export const getApplicationCompletenessFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const completenessPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Completeness"
  );
  const applicationIntakePhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );

  const completenessComplete = completenessPhase?.phaseStatus === "Completed";
  const completenessReviewDate = completenessPhase?.phaseDates.find(
    (date) => date.dateType === "Completeness Review Due Date"
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
  const initialDocuments = demonstration.documents.filter(
    (doc) => doc.phaseName === "Completeness"
  );

  return (
    <CompletenessPhase
      applicationId={demonstration.id}
      applicationIntakeComplete={applicationIntakePhase?.phaseStatus === "Completed"}
      completenessReviewDate={completenessReviewDate?.dateValue
        ? formatDateForServer(completenessReviewDate.dateValue)
        : ""
      }
      fedCommentStartDate={
        fedCommentStartDate?.dateValue ? formatDateForServer(fedCommentStartDate.dateValue) : ""
      }
      fedCommentEndDate={
        fedCommentEndDate?.dateValue ? formatDateForServer(fedCommentEndDate.dateValue) : ""
      }
      completenessComplete={completenessComplete}
      stateDeemedCompleteDate={
        stateDeemedCompleteDate?.dateValue
          ? formatDateForServer(stateDeemedCompleteDate.dateValue)
          : ""
      }
      initialDocuments={initialDocuments ?? []}
    />
  );
};

export interface CompletenessPhaseProps {
  applicationId: string;
  applicationIntakeComplete: boolean;
  completenessReviewDate?: string;
  fedCommentStartDate?: string;
  fedCommentEndDate?: string;
  completenessComplete: boolean;
  stateDeemedCompleteDate?: string;
  initialDocuments: ApplicationWorkflowDocument[];
}

export const CompletenessPhase = ({
  applicationId,
  applicationIntakeComplete,
  completenessReviewDate,
  fedCommentStartDate,
  fedCommentEndDate,
  completenessComplete,
  stateDeemedCompleteDate,
  initialDocuments,
}: CompletenessPhaseProps) => {
  const { showCompletenessDocumentUploadDialog, showDeclareIncompleteDialog } = useDialog();
  const { showSuccess, showError } = useToast();

  const [federalStartDate, setFederalStartDate] = useState<string>(fedCommentStartDate ?? "");
  const [federalEndDate, setFederalEndDate] = useState<string>(fedCommentEndDate ?? "");
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    !(completenessReviewDate && !completenessComplete)
  );
  const [stateDeemedComplete, setStateDeemedComplete] = useState<string>(
    stateDeemedCompleteDate ?? ""
  );

  const [completenessDocs] = useState<ApplicationWorkflowDocument[]>(
    initialDocuments
  );

  const { setApplicationDates } = useSetApplicationDates();

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

  const getNoticeContent = () => {
    if (!completenessReviewDate) return null;
    const noticeDueDateValue = parseISO(completenessReviewDate ?? "");
    const daysLeft = differenceInCalendarDays(noticeDueDateValue, new Date());
    if (daysLeft > 1) {
      return {
        title: `${daysLeft} days left`,
        description: `This Demonstration must be declared complete by ${formatDate(noticeDueDateValue)}`,
        variant: "warning" as NoticeVariant,
      };
    }
    if (daysLeft === 1) {
      return {
        title: "1 day left in Completion Period",
        description: `This Demonstration must be declared complete by ${formatDate(noticeDueDateValue)}`,
        variant: "error" as NoticeVariant,
      };
    }
    else {
      return {
        title:  `${Math.abs(daysLeft)} days past due`,
        description: `This Demonstration completeness was due on ${formatDate(noticeDueDateValue)}`,
        variant: "error" as NoticeVariant,
      };
    }
  };
  const noticeContent = useMemo(() => getNoticeContent(), [completenessReviewDate]);

  const finishIsEnabled = () => {
    const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
    const datesAreValid =
      federalStartDate && federalEndDate
        ? true
        : new Date(federalStartDate) <= new Date(federalEndDate);

    return applicationIntakeComplete &&
      completenessDocs.find(doc => doc.documentType === "Application Completeness Letter") &&
      completenessDocs.find(doc => doc.documentType === "Internal Completeness Review Form") &&
      datesFilled &&
      datesAreValid;
  };

  const saveDates = async (stateDeemedCompleteString: string) => {
    if (!stateDeemedCompleteString) return;

    const stateDeemedCompleteDate = parseISO(stateDeemedCompleteString);
    const { fedStartDate, fedEndDate } = getFederalCommentPeriodDates(stateDeemedCompleteString);

    const dates: ApplicationDateInput[] = [
      { dateType: "State Application Deemed Complete", dateValue: stateDeemedCompleteDate},
      { dateType: "Federal Comment Period Start Date", dateValue: fedStartDate ? startOfDay(fedStartDate) : null },
      { dateType: "Federal Comment Period End Date", dateValue: fedEndDate ? endOfDay(fedEndDate) : null },
    ];

    await setApplicationDates({
      applicationId,
      applicationDates: dates,
    });
  };

  const handleStateDeemedCompleteChange = (dateValue: string) => {
    if (!dateValue) {
      setStateDeemedComplete("");
      setFederalStartDate("");
      setFederalEndDate("");
      return;
    }
    saveDates(dateValue);
  };

  const handleDocumentUploadSucceeded = async (uploadedDoc?: UploadDocumentInput) => {
    if (uploadedDoc?.documentType !== "Application Completeness Letter") return;

    try {
      await saveDates(getTodayEst());
      showSuccess("Completeness dates saved successfully");
    } catch {
      showError("Failed to save completeness dates");
    }
  };

  const handleDeclareIncomplete = async () => {
    showDeclareIncompleteDialog(async () => {
      try {
        await setCompletenessIncompleted();
        showSuccess(SAVE_FOR_LATER_MESSAGE);
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  const handleFinishCompleteness = async () => {
    try {
      await completeCompletenessPhase();
      showSuccess(getPhaseCompletedMessage("Completeness"));
    } catch {
      showError("Failed to complete Completeness phase: ");
    }
  };

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the officially signed State Completeness Letter/internal checklists</p>
      <SecondaryButton
        onClick={() => showCompletenessDocumentUploadDialog(
          applicationId,
          handleDocumentUploadSucceeded
        )}
        size="small"
        name="open-upload"
      >
        Upload
        <ExportIcon />
      </SecondaryButton>
      <DocumentList documents={completenessDocs} />
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
          <DatePicker
            name="datepicker-state-application-deemed-complete"
            label="State Application Deemed Complete"
            value={stateDeemedComplete}
            onChange={handleStateDeemedCompleteChange}
          />
        </div>

        <div>
          <DatePicker
            name="datepicker-federal-comment-period-start"
            label="Federal Comment Period Start Date"
            value={federalStartDate}
            isDisabled
          />
        </div>

        <div>
          <DatePicker
            name="datepicker-federal-comment-period-end"
            label="Federal Comment Period End Date"
            value={federalEndDate}
            isDisabled
          />
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton name="declare-incomplete" size="small" onClick={handleDeclareIncomplete}>
          Declare Incomplete
        </SecondaryButton>
        <div className={STYLES.actionsEnd}>
          <Button
            name="finish-completeness"
            size="small"
            disabled={!finishIsEnabled()}
            onClick={handleFinishCompleteness}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-6">
        {!isNoticeDismissed && noticeContent && (
          <Notice
            title={noticeContent.title}
            description={noticeContent.description}
            variant={noticeContent.variant}
            onDismiss={() => setNoticeDismissed(true)}
          />
        )}
        <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">
          COMPLETENESS
        </h3>
      </div>
      <div id="completeness-phase-content">
        <p className="text-sm text-text-placeholder mb-4">
          Completeness Checklist - Find completeness guidelines online at{" "}
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
      </div>
    </div>
  );
};
