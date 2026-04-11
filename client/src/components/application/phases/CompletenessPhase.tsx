import React, { useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { ExportIcon } from "components/icons";
import { tw } from "tags/tw";
import { formatDate, formatDateForServer, getDateEst } from "util/formatDate";
import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { useToast } from "components/toast";
import { DocumentList } from "./sections";
import {
  ApplicationDateInput,
  LocalDate,
  PhaseName,
} from "demos-server";
import { useDialog } from "components/dialog/DialogContext";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";
import { Notice, NoticeVariant } from "components/notice/Notice";
import {
  useCompletePhase,
  useDeclareCompletenessPhaseIncomplete,
} from "components/application/phase-status/phaseCompletionQueries";

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

const CompletenessNotice = ({
  completenessReviewDate,
  completenessComplete,
}: {
  completenessReviewDate?: string;
  completenessComplete: boolean;
}) => {
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    !(completenessReviewDate && !completenessComplete)
  );

  const noticeContent = useMemo(() => {
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
    } else {
      return {
        title: `${Math.abs(daysLeft)} days past due`,
        description: `This Demonstration completeness was due on ${formatDate(noticeDueDateValue)}`,
        variant: "error" as NoticeVariant,
      };
    }
  }, [completenessReviewDate]);

  if (isNoticeDismissed || !noticeContent) return null;

  return (
    <Notice
      title={noticeContent.title}
      description={noticeContent.description}
      variant={noticeContent.variant}
      onDismiss={() => setNoticeDismissed(true)}
    />
  );
};

const THIS_PHASE_NAME: PhaseName = "Completeness";
const NEXT_PHASE_NAME: PhaseName = "Federal Comment";

export const COMPLETENESS_UPLOAD_BUTTON_NAME = "button-open-completeness-upload";
export const COMPLETENESS_FINISH_BUTTON_NAME = "button-finish-completeness";
export const COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME = "button-declare-incomplete";
export const STATE_DEEMED_COMPLETE_DATEPICKER_NAME = "datepicker-state-application-deemed-complete";
export const FEDERAL_COMMENT_START_DATEPICKER_NAME = "datepicker-federal-comment-period-start";
export const FEDERAL_COMMENT_END_DATEPICKER_NAME = "datepicker-federal-comment-period-end";

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

const calculateFederalCommentPeriodDates = (
  stateDeemedCompleteDate: string
): { federalStartDate: string; federalEndDate: string } => {
  if (!stateDeemedCompleteDate) return { federalStartDate: "", federalEndDate: "" };

  const parsedStateDeemedCompleteDate = parseISO(stateDeemedCompleteDate);
  const federalStartDate = addDays(parsedStateDeemedCompleteDate, 1);
  const federalEndDate = addDays(parsedStateDeemedCompleteDate, 1 + FEDERAL_COMMENT_PERIOD_DAYS);

  return {
    federalStartDate: formatDateForServer(federalStartDate),
    federalEndDate: formatDateForServer(federalEndDate),
  };
};

export const getApplicationCompletenessFromApplication = (
  application: WorkflowApplication,
  setSelectedPhase: (phase: PhaseName) => void
) => {
  const completenessPhase = application.phases.find((phase) => phase.phaseName === THIS_PHASE_NAME);
  const applicationIntakePhase = application.phases.find(
    (phase) => phase.phaseName === "Application Intake"
  );

  const findDate = (dateType: string): string => {
    const dateValue = completenessPhase?.phaseDates.find(
      (date) => date.dateType === dateType
    )?.dateValue;
    return dateValue ? getDateEst(dateValue) : "";
  };

  const completenessDocuments = application.documents.filter(
    (doc) => doc.phaseName === THIS_PHASE_NAME
  );

  return (
    <CompletenessPhase
      applicationId={application.id}
      applicationIntakeComplete={applicationIntakePhase?.phaseStatus === "Completed"}
      completenessReviewDate={findDate("Completeness Review Due Date")}
      completenessComplete={completenessPhase?.phaseStatus === "Completed"}
      completenessIncomplete={completenessPhase?.phaseStatus === "Incomplete"}
      stateDeemedCompleteDate={findDate("State Application Deemed Complete")}
      completenessDocuments={completenessDocuments}
      setSelectedPhase={setSelectedPhase}
    />
  );
};

const calculateStateDeemedCompleteDate = (
  stateDeemedCompleteDate: string,
  completenessDocuments: ApplicationWorkflowDocument[],
  completenessIncomplete: boolean
): string => {
  if (stateDeemedCompleteDate) return stateDeemedCompleteDate;
  if (completenessIncomplete) return "";
  const applicationCompletenessLetter = completenessDocuments.find(
    (doc) => doc.documentType === "Application Completeness Letter"
  );
  if (!applicationCompletenessLetter) return "";
  return getDateEst(applicationCompletenessLetter.createdAt);
};

export interface CompletenessPhaseProps {
  applicationId: string;
  applicationIntakeComplete: boolean;
  completenessReviewDate?: string;
  completenessComplete: boolean;
  completenessIncomplete: boolean;
  stateDeemedCompleteDate: string;
  completenessDocuments: ApplicationWorkflowDocument[];
  setSelectedPhase: (phase: PhaseName) => void;
}

export const CompletenessPhase = ({
  applicationId,
  applicationIntakeComplete,
  completenessReviewDate,
  completenessComplete,
  completenessIncomplete,
  stateDeemedCompleteDate,
  completenessDocuments,
  setSelectedPhase,
}: CompletenessPhaseProps) => {
  const { showCompletenessDocumentUploadDialog, showDeclareIncompleteDialog } = useDialog();
  const { showSuccess, showError } = useToast();
  const { setApplicationDates } = useSetApplicationDates();
  const { completePhase } = useCompletePhase();
  const { declareCompletenessPhaseIncomplete } = useDeclareCompletenessPhaseIncomplete();

  const [userSelectedStateDeemedCompleteDate, setUserSelectedStateDeemedCompleteDate] =
    useState("");

  useEffect(() => {
    if (completenessIncomplete) {
      setUserSelectedStateDeemedCompleteDate("");
    }
  }, [completenessIncomplete]);

  const calculatedStateDeemedCompleteDate = calculateStateDeemedCompleteDate(
    stateDeemedCompleteDate,
    completenessDocuments,
    completenessIncomplete
  );
  const stateDeemedComplete =
    userSelectedStateDeemedCompleteDate || calculatedStateDeemedCompleteDate;
  const { federalStartDate, federalEndDate } =
    calculateFederalCommentPeriodDates(stateDeemedComplete);

  const finishIsEnabled = () => {
    const datesFilled = Boolean(stateDeemedComplete && federalStartDate && federalEndDate);
    const datesAreValid =
      federalStartDate && federalEndDate
        ? true
        : new Date(federalStartDate) <= new Date(federalEndDate);

    return (
      !completenessComplete &&
      applicationIntakeComplete &&
      completenessDocuments.find((doc) => doc.documentType === "Application Completeness Letter") &&
      completenessDocuments.find(
        (doc) => doc.documentType === "Internal Completeness Review Form"
      ) &&
      datesFilled &&
      datesAreValid
    );
  };

  const saveDates = async () => {
    const dates: ApplicationDateInput[] = [
      {
        dateType: "State Application Deemed Complete",
        dateValue: stateDeemedComplete as LocalDate,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: federalStartDate as LocalDate,
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: federalEndDate as LocalDate,
      },
    ];

    await setApplicationDates({
      applicationId,
      applicationDates: dates,
    });
  };

  const handleDeclareIncomplete = async () => {
    showDeclareIncompleteDialog(async () => {
      try {
        await declareCompletenessPhaseIncomplete(applicationId);
        showSuccess(SAVE_FOR_LATER_MESSAGE);
      } catch (error) {
        showError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  const handleFinishCompleteness = async () => {
    try {
      await saveDates();
      await completePhase({
        applicationId: applicationId,
        phaseName: THIS_PHASE_NAME,
      });
      showSuccess(getPhaseCompletedMessage(THIS_PHASE_NAME));
      setSelectedPhase(NEXT_PHASE_NAME);
    } catch (e) {
      console.error(e);
      showError(`Failed to complete ${THIS_PHASE_NAME} phase`);
    }
  };

  const UploadSection = () => (
    <div aria-labelledby="completeness-upload-title">
      <h4 id="completeness-upload-title" className={STYLES.title}>
        STEP 1 - UPLOAD
      </h4>
      <p className={STYLES.helper}>
        Upload the officially signed State Completeness Letter/internal checklists
      </p>
      <SecondaryButton
        onClick={() => showCompletenessDocumentUploadDialog(applicationId)}
        size="small"
        name={COMPLETENESS_UPLOAD_BUTTON_NAME}
      >
        Upload
        <ExportIcon />
      </SecondaryButton>
      <DocumentList documents={completenessDocuments} />
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
            name={STATE_DEEMED_COMPLETE_DATEPICKER_NAME}
            label="State Application Deemed Complete"
            value={stateDeemedComplete}
            onChange={(date) => {
              setUserSelectedStateDeemedCompleteDate(date);
            }}
            isDisabled={completenessComplete}
          />
        </div>

        <div>
          <DatePicker
            name={FEDERAL_COMMENT_START_DATEPICKER_NAME}
            label="Federal Comment Period Start Date"
            value={federalStartDate}
            isDisabled
          />
        </div>

        <div>
          <DatePicker
            name={FEDERAL_COMMENT_END_DATEPICKER_NAME}
            label="Federal Comment Period End Date"
            value={federalEndDate}
            isDisabled
          />
        </div>
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          name={COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME}
          size="small"
          onClick={handleDeclareIncomplete}
          disabled={completenessComplete}
        >
          Declare Incomplete
        </SecondaryButton>
        <div className={STYLES.actionsEnd}>
          <Button
            name={COMPLETENESS_FINISH_BUTTON_NAME}
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
        <CompletenessNotice
          completenessReviewDate={completenessReviewDate}
          completenessComplete={completenessComplete}
        />
        <h3 className="text-brand text-[22px] font-bold">COMPLETENESS</h3>
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
            Medicaid.gov
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
