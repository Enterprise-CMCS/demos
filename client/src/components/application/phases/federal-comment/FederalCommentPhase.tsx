import React, { useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { assertIsLocalDate, formatDateForDisplay, formatDateForServer, getTodayEst } from "util/formatDate";
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
const MAX_START_DATE = "2099-12-31";

const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-1 md:grid-cols-2 gap-10`,
  divider: tw`pointer-events-none hidden md:block absolute left-1/2 top-0 h-full border-l border-border-subtle`,
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
  const completenessPhase = application.phases.find((phase) => phase.phaseName === "Completeness");
  const stateDeemedCompleteDate =
    completenessPhase?.phaseDates.find(
      (date) => date.dateType === "State Application Deemed Complete"
    )?.plainDate ?? "";

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
      key={application.id}
      demonstrationId={application.id}
      phaseComplete={phaseComplete}
      completenessComplete={completenessPhase?.phaseStatus === "Completed"}
      stateDeemedCompleteDate={stateDeemedCompleteDate}
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
  const [dismissedEndDate, setDismissedEndDate] = useState<string>();

  const getNoticeContent = () => {
    if (!phaseEndDate) return null;
    const daysLeft = differenceInCalendarDays(parseISO(phaseEndDate), parseISO(getTodayEst()));
    if (daysLeft > 1) {
      return {
        title: `${daysLeft} days left in Federal Comment Period`,
        description: `The Federal Comment Period ends on ${formatDateForDisplay(phaseEndDate)}`,
        variant: "warning" as NoticeVariant,
      };
    }
    if (daysLeft >= 0) {
      return {
        title: `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left in Federal Comment Period`,
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

  if (phaseComplete || dismissedEndDate === phaseEndDate || !noticeContent) return null;

  return (
    <Notice
      title={noticeContent.title}
      description={noticeContent.description}
      variant={noticeContent.variant}
      onDismiss={() => setDismissedEndDate(phaseEndDate)}
    />
  );
};

interface FederalCommentPhaseProps {
  demonstrationId: string;
  phaseStartDate?: string;
  phaseEndDate?: string;
  phaseComplete: boolean;
  completenessComplete: boolean;
  stateDeemedCompleteDate: string;
  documents: ApplicationWorkflowDocument[];
}

export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId,
  phaseStartDate,
  phaseEndDate,
  phaseComplete,
  completenessComplete,
  stateDeemedCompleteDate,
  documents,
}) => {
  const { showFederalCommentDocumentUploadDialog } = useDialog();
  const { currentUser } = getCurrentUser();
  const { showSuccess, showError } = useToast();
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [declaredDates, setDeclaredDates] = useState<{ start: string; end: string }>();
  const [isSaving, setIsSaving] = useState(false);
  const { setApplicationDates } = useSetApplicationDates();

  const isReadonlyUser = isReadonly(currentUser, "ApplicationWorkflow");
  const savedStartDate = phaseStartDate || declaredDates?.start;
  const savedEndDate = phaseEndDate || declaredDates?.end;
  const datesDeclared = Boolean(savedStartDate || savedEndDate);
  const minStartDate = stateDeemedCompleteDate
    ? formatDateForServer(addDays(parseISO(stateDeemedCompleteDate), 1))
    : "1900-01-01";
  const validStartDate = Boolean(
    /^\d{4}-\d{2}-\d{2}$/.test(selectedStartDate) &&
    isValid(parseISO(selectedStartDate)) &&
    selectedStartDate >= minStartDate &&
    selectedStartDate <= MAX_START_DATE
  );
  const calculatedEndDate = validStartDate
    ? formatDateForServer(addDays(parseISO(selectedStartDate), FEDERAL_COMMENT_PERIOD_DAYS))
    : "";
  const displayedEndDate = datesDeclared ? savedEndDate : calculatedEndDate;
  const canDeclare =
    __FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__ &&
    completenessComplete &&
    Boolean(stateDeemedCompleteDate) &&
    !phaseComplete &&
    !isReadonlyUser &&
    !datesDeclared &&
    !isSaving;

  const handleDeclareDates = async () => {
    if (!canDeclare || !validStartDate) return;
    setIsSaving(true);
    try {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: [
          {
            dateType: "Federal Comment Period Start Date",
            plainDate: assertIsLocalDate(selectedStartDate),
          },
          {
            dateType: "Federal Comment Period End Date",
            plainDate: assertIsLocalDate(calculatedEndDate),
          },
        ],
      });
      setDeclaredDates({ start: selectedStartDate, end: calculatedEndDate });
      showSuccess("Federal Comment Start Date declared.");
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to declare Federal Comment Start Date."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-6">
        <FederalCommentNotice phaseEndDate={savedEndDate} phaseComplete={phaseComplete} />

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
          <div className="min-w-0" aria-labelledby="federal-comment-verify-title">
            <h4 id="federal-comment-verify-title" className={STYLES.title}>
              Step 1 - Verify
            </h4>
            <p
              className={STYLES.helper}
              data-testid={FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.testId}
            >
              {FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.text}
            </p>
            {__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__ ? (
              <div className="flex flex-col gap-4 mt-4 text-sm">
                <DatePicker
                  name="datepicker-federal-comment-period-start"
                  label="Federal Comment Period Start Date"
                  value={savedStartDate || selectedStartDate}
                  onChange={setSelectedStartDate}
                  isRequired
                  isDisabled={!canDeclare}
                  minDate={minStartDate}
                  maxDate={MAX_START_DATE}
                />
                <div className="flex flex-col gap-2">
                  <span className="font-bold">Federal Comment Period End Date</span>
                  <span data-testid="federal-comment-period-end-date">
                    {displayedEndDate ? formatDateForDisplay(displayedEndDate) : "--/--/----"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-8 mt-4 text-sm text-text-placeholder">
                <div className="flex flex-col">
                  <span className="font-bold">Federal Comment Period Start Date</span>
                  <span>
                    {phaseStartDate ? formatDateForDisplay(phaseStartDate) : "--/--/----"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold">Federal Comment Period End Date</span>
                  <span>{phaseEndDate ? formatDateForDisplay(phaseEndDate) : "--/--/----"}</span>
                </div>
              </div>
            )}
          </div>
          <ApplicationUploadSection
            title="Step 2 - Upload"
            helperText={FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION.text}
            documents={documents}
            onUploadClick={() => showFederalCommentDocumentUploadDialog(demonstrationId)}
          />
        </div>
      </section>
      {__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__ && (
        <div className={STYLES.actions}>
          <Button
            name="button-declare-federal-comment-start-date"
            aria-label="Declare Federal Comment Start Date"
            size="small"
            isHidden={isReadonlyUser}
            disabled={!canDeclare || !validStartDate}
            onClick={handleDeclareDates}
          >
            Declare Federal Comment Start Date
          </Button>
        </div>
      )}
    </div>
  );
};
