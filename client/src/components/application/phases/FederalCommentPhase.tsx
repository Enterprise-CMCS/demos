import React, { useEffect, useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { formatDate, formatDateForServer } from "util/formatDate";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { FederalCommentUploadDialog } from "components/dialog/document/FederalCommentUploadDialog";
import { differenceInCalendarDays } from "date-fns";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { Notice, NoticeVariant } from "components/notice";
import { parseInputDate } from "util/parseDate";

interface FederalCommentPhaseProps {
  demonstrationId: string;
  phaseStartDate: string;
  phaseEndDate: string;
  phaseComplete: boolean;
  documents?: DocumentTableDocument[];
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

  return <FederalCommentPhase
    demonstrationId={demonstration.id}
    phaseComplete={phaseComplete}
    phaseStartDate={
      phaseStartDate?.dateValue ? formatDate(phaseStartDate.dateValue) : ""
    }
    phaseEndDate={
      phaseEndDate?.dateValue ? formatDate(phaseEndDate.dateValue) : ""
    }
  />;
};

export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId = "default-demo-id",
  phaseStartDate,
  phaseEndDate,
  phaseComplete,
  documents = [],
}) => {
  const [isUploadOpen, setUploadOpen] = useState(false);

  const FederalCommentNotice = () => {
    useEffect(() => {
      setNoticeDismissed(phaseComplete === true);
    }, [phaseComplete]);

    const [isNoticeDismissed, setNoticeDismissed] = useState(
      phaseComplete === true
    );

    if (phaseEndDate) {
      useEffect(() => {
        setNoticeDismissed(phaseComplete);
      }, [phaseComplete]);

      const noticeDueDateValue = parseInputDate(formatDateForServer(phaseEndDate));

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
        ? `The Federal Comment Period ends on ${formattedNoticeDate}`
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

  const VerifyCompleteSection = () => (
    <div aria-labelledby="concept-verify-title">
      <div>
        <h4 id="concept-verify-title" className={STYLES.title}>
          STEP 2 - VERIFY/COMPLETE
        </h4>
        <p className={STYLES.helper}>
          The Federal Comment phase automatically completes after the Federal Comment End Date.
        </p>
      </div>
      <div className="flex gap-8 mt-4 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <span className="font-bold">Federal Comment Period Start Date</span>
          <span>{phaseStartDate}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold">Federal Comment Period End Date</span>
          <span>{phaseEndDate}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <FederalCommentNotice />

      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">
        FEDERAL COMMENT PERIOD
      </h3>
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
          <ApplicationUploadSection
            title="STEP 1 - UPLOAD"
            helperText="Upload the Internal Analysis Document (Optional)"
            documents={documents}
            onUploadClick={() => showFederalCommentDocumentUploadDialog(demonstrationId)}
            onDeleteDocument={(id) => console.log(id)}
          />
          <VerifyCompleteSection />
        </div>
      </section>
    </div>
  );
};
