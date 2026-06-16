import React, { useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { formatDateForDisplay } from "util/formatDate";
import { useDialog } from "components/dialog/DialogContext";
import { WorkflowApplication, ApplicationWorkflowDocument } from "components/application";
import { differenceInCalendarDays } from "date-fns";
import { Notice, NoticeVariant } from "components/notice";
import { DateType, PhaseName } from "demos-server-constants";

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
  text: "Upload the internal Analysis Document (Optional).",
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
      phaseStartDate={phaseStartDate?.dateValue}
      phaseEndDate={phaseEndDate?.dateValue}
      documents={initialDocuments}
    />
  );
};

const FederalCommentNotice: React.FC<{ phaseEndDate?: Date; phaseComplete: boolean }> = ({
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
  phaseStartDate?: Date;
  phaseEndDate?: Date;
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

  const VerifyCompleteSection = () => (
    <div aria-labelledby="concept-verify-title">
      <div>
        <h4 id="concept-verify-title" className={STYLES.title}>
          Step 1 - Verify
        </h4>
        <p
          className={STYLES.helper}
          data-testid={FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.testId}
        >
          {FEDERAL_COMMENT_PHASE_STEP_ONE_DESCRIPTION.text}
        </p>
      </div>
      <div className="flex gap-8 mt-4 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <span className="font-bold">
            {"Federal Comment Period Start Date" satisfies DateType}
          </span>
          <span>{phaseStartDate ? formatDateForDisplay(phaseStartDate) : "--/--/----"}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold">{"Federal Comment Period End Date" satisfies DateType}</span>
          <span>{phaseEndDate ? formatDateForDisplay(phaseEndDate) : "--/--/----"}</span>
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
          <VerifyCompleteSection />
          <ApplicationUploadSection
            title="Step 2 - Upload"
            helperText={FEDERAL_COMMENT_PHASE_STEP_TWO_DESCRIPTION.text}
            documents={documents}
            onUploadClick={() => showFederalCommentDocumentUploadDialog(demonstrationId)}
          />
        </div>
      </section>
    </div>
  );
};
