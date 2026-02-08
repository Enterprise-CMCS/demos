import React, { useMemo, useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { formatDate } from "util/formatDate";
import { useDialog } from "components/dialog/DialogContext";
import { ApplicationWorkflowDemonstration, ApplicationWorkflowDocument } from "../ApplicationWorkflow";
import { differenceInCalendarDays } from "date-fns";
import { Notice, NoticeVariant } from "components/notice";

interface FederalCommentPhaseProps {
  demonstrationId: string;
  phaseStartDate: Date | undefined;
  phaseEndDate: Date | undefined;
  phaseComplete: boolean;
  initialDocuments?: ApplicationWorkflowDocument[];
}

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

export const getFederalCommentPhaseFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const federalCommentPhase = demonstration.phases.find(
    (phase) => phase.phaseName === "Federal Comment"
  );

  const phaseComplete = federalCommentPhase?.phaseStatus === "Completed";

  const phaseStartDate = federalCommentPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period Start Date"
  );
  const phaseEndDate = federalCommentPhase?.phaseDates.find(
    (date) => date.dateType === "Federal Comment Period End Date"
  );

  const initialDocuments = demonstration.documents.filter(
    (doc) => doc.phaseName === "Federal Comment"
  );

  return (
    <FederalCommentPhase
      demonstrationId={demonstration.id}
      phaseComplete={phaseComplete}
      phaseStartDate={phaseStartDate?.dateValue}
      phaseEndDate={phaseEndDate?.dateValue}
      initialDocuments={initialDocuments}
    />
  );
};

export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId = "default-demo-id",
  phaseStartDate,
  phaseEndDate,
  phaseComplete,
  initialDocuments = [],
}) => {
  const { showFederalCommentDocumentUploadDialog } = useDialog();
  const [documents] = useState<ApplicationWorkflowDocument[]>(
    initialDocuments
  );
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    !(phaseEndDate && !phaseComplete)
  );

  const getNoticeContent = () => {
    if (!phaseEndDate) return null;
    const daysLeft = differenceInCalendarDays(phaseEndDate, new Date());
    if (daysLeft > 1) {
      return {
        title: `${daysLeft} days left in Federal Comment Period`,
        description: `The Federal Comment Period ends on ${formatDate(phaseEndDate)}`,
        variant: "warning" as NoticeVariant,
      };
    }
    if (daysLeft === 1) {
      return {
        title: "1 day left in Federal Comment Period",
        description: `The Federal Comment Period ends on ${formatDate(phaseEndDate)}`,
        variant: "error" as NoticeVariant,
      };
    }
    else {
      return {
        title:  `${Math.abs(daysLeft)} days past due`,
        description: `The Federal Comment Period ended on ${formatDate(phaseEndDate)}`,
        variant: "error" as NoticeVariant,
      };
    }
  };
  const noticeContent = useMemo(() => getNoticeContent(), [phaseEndDate]);

  const VerifyCompleteSection = () => (
    <div aria-labelledby="concept-verify-title">
      <div>
        <h4 id="concept-verify-title" className={STYLES.title}>
          STEP 1 - VERIFY/COMPLETE
        </h4>
        <p className={STYLES.helper}>
          The Federal Comment phase automatically completes after the Federal Comment End Date.
        </p>
      </div>
      <div className="flex gap-8 mt-4 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <span className="font-bold">Federal Comment Period Start Date</span>
          <span>{phaseStartDate ? formatDate(phaseStartDate) : "--/--/----"}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold">Federal Comment Period End Date</span>
          <span>{phaseEndDate ? formatDate(phaseEndDate) : "--/--/----"}</span>
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
          FEDERAL COMMENT PERIOD
        </h3>
      </div>
      <p className="text-sm text-text-placeholder mb-4">
        Federal Comment Period Review. Find completeness guidelines online at{" "}
        <a
          className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
          href="https://www.medicaid.gov"
        >
          Medicaid.gov
        </a>
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <VerifyCompleteSection />
          <ApplicationUploadSection
            title="STEP 2 - UPLOAD"
            helperText="Upload the Internal Analysis Document (Optional)"
            documents={documents}
            onUploadClick={() => showFederalCommentDocumentUploadDialog(demonstrationId)}
          />
        </div>
      </section>
    </div>
  );
};
