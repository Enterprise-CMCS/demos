import React, { useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { assertIsLocalDate, formatDateForDisplay, formatDateForServer } from "util/formatDate";
import { useDialog } from "components/dialog/DialogContext";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { addDays, differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { Notice, NoticeVariant } from "components/notice";
import { DateType, PhaseName } from "demos-server-constants";
import { DatePicker } from "components/input/date/DatePicker";
import { Button } from "components/button";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import { useToast } from "components/toast";

const FEDERAL_COMMENT_PERIOD_DAYS = 30;

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

export const FEDERAL_COMMENT_PHASE_DESCRIPTION = {
  text: "Use this phase to record federal reviewer comments and requested clarifications on the application before it moves forward.",
  testId: "federal-comment-phase-description",
};
export const FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION = {
  text: "Verify that the document is uploaded/accurate and that all required fields are filled.",
  testId: "federal-comment-phase-step-one-description",
};
export const FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION = {
  text: "Upload the Internal Analysis Document (Optional).",
};

export const getFederalCommentPhaseFromApplication = (application: WorkflowApplication) => {
  const federalCommentPhase = application.phases.find(
    (phase) => phase.phaseName === "Federal Comment"
  );

  const phaseComplete = federalCommentPhase?.phaseStatus === "Completed";

  const phaseStartDate = federalCommentPhase?.phaseDates.find(
    (date) => date.dateType === ("Federal Comment Period Start Date" satisfies DateType)
  );
  const phaseEndDate = federalCommentPhase?.phaseDates.find(
    (date) => date.dateType === ("Federal Comment Period End Date" satisfies DateType)
  );

  const initialDocuments = application.documents.filter(
    (doc) => doc.phaseName === "Federal Comment"
  );

  return (
    <FederalCommentPhase
      demonstrationId={application.id}
      phaseComplete={phaseComplete}
      phaseStartDate={phaseStartDate?.plainDate}
      phaseEndDate={phaseEndDate?.plainDate}
      documents={initialDocuments}
    />
  );
};

const FederalCommentNotice: React.FC<{ phaseEndDate?: string; phaseComplete: boolean }> = ({
  phaseEndDate,
  phaseComplete,
}) => {
  const [isDismissed, setDismissed] = useState(!(phaseEndDate && !phaseComplete));

  const getNoticeContent = () => {
    if (!phaseEndDate) return null;
    const daysLeft = differenceInCalendarDays(phaseEndDate, new Date());
    if (daysLeft > 1) {
      return {
        title: `${daysLeft} days left in Federal Comment Period`,
        description: `The Federal Comment Period ends on ${formatDateForDisplay(phaseEndDate)}`,
        variant: "warning" as NoticeVariant,
      };
    }
    if (daysLeft === 1) {
      return {
        title: "1 day left in Federal Comment Period",
        description: `The Federal Comment Period ends on ${formatDateForDisplay(phaseEndDate)}`,
        variant: "error" as NoticeVariant,
      };
    }
    return {
      title: `${Math.abs(daysLeft)} days past due`,
      description: `The Federal Comment Period ended on ${formatDateForDisplay(phaseEndDate)}`,
      variant: "error" as NoticeVariant,
    };
  };

  const noticeContent = getNoticeContent();

  if (isDismissed || !noticeContent) return null;

  return (
    <Notice
      title={noticeContent.title}
      description={noticeContent.description}
      variant={noticeContent.variant}
      onDismiss={() => setDismissed(true)}
    />
  );
};

interface FederalCommentPhaseProps {
  demonstrationId: string;
  phaseStartDate?: string;
  phaseEndDate?: string;
  phaseComplete: boolean;
  documents: ApplicationWorkflowDocument[];
}

export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId,
  phaseStartDate,
  phaseEndDate,
  phaseComplete,
  documents,
}) => {
  const { showFederalCommentDocumentUploadDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const { showSuccess, showError } = useToast();
  const [selectedStartDate, setSelectedStartDate] = useState<string>();
  const { setApplicationDates, loading } = useSetApplicationDates();

  const startDate = selectedStartDate ?? phaseStartDate ?? "";
  const validStartDate = isValid(parseISO(startDate));
  const endDate = validStartDate
    ? formatDateForServer(addDays(parseISO(startDate), FEDERAL_COMMENT_PERIOD_DAYS))
    : "";
  const isReadonlyUser = isReadonly(currentUser, "ApplicationWorkflow");
  const isDisabled = isReadonlyUser || phaseComplete || loading;

  const handleDeclareStartDate = async () => {
    if (isDisabled || !validStartDate) return;
    try {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: [
          {
            dateType: "Federal Comment Period Start Date",
            plainDate: assertIsLocalDate(startDate),
          },
          { dateType: "Federal Comment Period End Date", plainDate: assertIsLocalDate(endDate) },
        ],
      });
      showSuccess("Federal Comment Start Date declared.");
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to declare Federal Comment Start Date."
      );
    }
  };

  const verifySection = (
    <div aria-labelledby="federal-comment-verify-title">
      <div>
        <h4 id="federal-comment-verify-title" className={STYLES.title}>
          Step 1 - Verify
        </h4>
        <p
          className={STYLES.helper}
          data-testid={FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.testId}
        >
          {FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.text}
        </p>
      </div>
      <div className="flex flex-col gap-4 mt-4 text-sm">
        <DatePicker
          name="datepicker-federal-comment-period-start"
          label="Federal Comment Period Start Date"
          value={startDate}
          onChange={setSelectedStartDate}
          isRequired
          isDisabled={isDisabled}
        />
        <div className="flex flex-col gap-2">
          <span className="font-bold">{"Federal Comment Period End Date" satisfies DateType}</span>
          <span data-testid="federal-comment-period-end-date">
            {endDate ? formatDateForDisplay(endDate) : "--/--/----"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col gap-6">
        <FederalCommentNotice phaseEndDate={phaseEndDate} phaseComplete={phaseComplete} />

        <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1 uppercase">
          {"Federal Comment" satisfies PhaseName}
        </h3>
      </div>
      <p
        className="text-sm text-text-placeholder mb-4"
        data-testid={FEDERAL_COMMENT_PHASE_DESCRIPTION.testId}
      >
        {FEDERAL_COMMENT_PHASE_DESCRIPTION.text}
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          {verifySection}
          <ApplicationUploadSection
            title="Step 2 - Upload"
            helperText={FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION.text}
            documents={documents}
            onUploadClick={() => showFederalCommentDocumentUploadDialog(demonstrationId)}
          />
        </div>
      </section>
      <div className={STYLES.actions}>
        <Button
          name="button-declare-federal-comment-start-date"
          aria-label="Declare Federal Comment Start Date"
          size="small"
          isHidden={isReadonlyUser}
          disabled={
            isDisabled ||
            !validStartDate ||
            (startDate === phaseStartDate && endDate === phaseEndDate)
          }
          onClick={handleDeclareStartDate}
        >
          Declare Federal Comment Start Date
        </Button>
      </div>
    </div>
  );
};
