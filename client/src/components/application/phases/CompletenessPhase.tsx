import React, { useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, formatDateForServer } from "util/formatDate";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import {
  ApplicationWorkflowDemonstration,
  ApplicationWorkflowDocument,
} from "../ApplicationWorkflow";
import { useToast } from "components/toast";
import { DocumentList } from "./sections";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, SetApplicationDateInput } from "demos-server";
import { useDialog } from "components/dialog/DialogContext";
import { useSetApplicationDate } from "components/application/date/dateQueries";
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

type CompletenessPhaseDateType = Extract<
  DateType,
  | "State Application Deemed Complete"
  | "Federal Comment Period Start Date"
  | "Federal Comment Period End Date"
  | "Completeness Completion Date"
>;

export const getInputsForCompletenessPhase = (
  applicationId: string,
  dateValues: Partial<Record<CompletenessPhaseDateType, string>>
): SetApplicationDateInput[] => {
  return Object.entries(dateValues).map(([dateType, dateValue]) => ({
    applicationId,
    dateType: dateType,
    dateValue: dateValue,
  })) as SetApplicationDateInput[];
};

export const getApplicationCompletenessFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const completenessPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Completeness"
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

  const applicationIntakePhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );
  const applicationIntakeCompletionDate = applicationIntakePhase?.phaseDates.find(
    (date) => date.dateType === "Application Intake Completion Date"
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
      hasApplicationIntakeCompletionDate={!!applicationIntakeCompletionDate}
    />
  );
};

export interface CompletenessPhaseProps {
  applicationId: string;
  completenessReviewDate?: string;
  fedCommentStartDate?: string;
  fedCommentEndDate?: string;
  completenessComplete: boolean;
  stateDeemedCompleteDate?: string;
  initialDocuments: ApplicationWorkflowDocument[];
  hasApplicationIntakeCompletionDate: boolean;
}

export const CompletenessPhase = ({
  applicationId,
  completenessReviewDate,
  fedCommentStartDate,
  fedCommentEndDate,
  completenessComplete,
  stateDeemedCompleteDate,
  initialDocuments,
  hasApplicationIntakeCompletionDate,
}: CompletenessPhaseProps) => {
  const { showCompletenessDocumentUploadDialog, showDeclareIncompleteDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const [collapsed, setCollapsed] = useState(false);

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

  const { setApplicationDate } = useSetApplicationDate();

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
      setFederalStartDate("");
      setFederalEndDate("");
      return;
    }

    const parsedStateDate = parseISO(stateDeemedComplete);
    const computedStartDate = addDays(parsedStateDate, 1);
    const computedEndDate = addDays(computedStartDate, FEDERAL_COMMENT_PERIOD_DAYS);

    const nextStart = formatDateForServer(computedStartDate);
    const nextEnd = formatDateForServer(computedEndDate);

    setFederalStartDate(nextStart);
    setFederalEndDate(nextEnd);
  }, [stateDeemedComplete]);

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

    return completenessDocs.length > 0 && datesFilled && datesAreValid;
  };

  const getDateValues = (): Partial<Record<CompletenessPhaseDateType, string>> => {
    return {
      ...(stateDeemedComplete && { "State Application Deemed Complete": stateDeemedComplete }),
      ...(federalStartDate && { "Federal Comment Period Start Date": federalStartDate }),
      ...(federalEndDate && { "Federal Comment Period End Date": federalEndDate }),
      ...(hasApplicationIntakeCompletionDate &&
        stateDeemedComplete && { "Completeness Completion Date": stateDeemedComplete }),
    };
  };

  const saveDates = async () => {
    const inputs = getInputsForCompletenessPhase(applicationId, getDateValues());

    try {
      for (const input of inputs) {
        await setApplicationDate(input);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : String(error));
      console.error("Error saving Phase: ", error);
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
    await saveDates();
    await completeCompletenessPhase();
    showSuccess(getPhaseCompletedMessage("Completeness"));
  };

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>Upload the officially signed State Completeness Letter/internal checklists</p>
      <SecondaryButton
        onClick={() => {
          showCompletenessDocumentUploadDialog(applicationId);
        }}
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
            onChange={(newDate) => {
              setStateDeemedComplete(newDate);
            }}
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
        <button
          className="flex items-center gap-2 mb-2 text-brand font-bold text-[22px] tracking-wide focus:outline-none"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls="completeness-phase-content"
          data-testid="toggle-completeness"
        >
          COMPLETENESS
        </button>
      </div>
      {!collapsed && (
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
      )}
    </div>
  );
};
