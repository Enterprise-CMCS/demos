import React, { useMemo, useState } from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { ExitIcon, WarningIcon } from "components/icons";
import { formatDate } from "util/formatDate";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { FederalCommentUploadDialog } from "components/dialog/document/FederalCommentUploadDialog";

interface FederalCommentPhaseProps {
  demonstrationId: string;
  phaseStartDate?: Date | null;
  phaseEndDate?: Date | null;
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


export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId = "default-demo-id",
  phaseStartDate,
  phaseEndDate,
  documents = [],
}) => {
  const [showWarning, setShowWarning] = useState(true);
  const [isUploadOpen, setUploadOpen] = useState(false);

  // Parse and memoize the end date
  const daysLeft = useMemo(() => {
    if (!phaseEndDate) return null;
    const endDate = new Date(phaseEndDate);
    const now = new Date();

    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }, [phaseEndDate]);

  const safeDaysLeft = daysLeft !== null ? Math.max(daysLeft, 0) : null;
  const dayLabel = safeDaysLeft === 1 ? "day" : "days";

  const borderColorClass = daysLeft !== null && daysLeft <= 1 ? "border-border-warn" : "border-border-alert";
  const warningClasses = tw`
    w-[600px] p-sm rounded-md shadow-lg
    bg-white text-text-font border border-l-4
    flex items-center
    transition-all duration-300 ease-in-out
    animate-fade-in
    mb-3
  ` + ` ${borderColorClass}`;

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
      {showWarning && safeDaysLeft !== null && phaseEndDate && (
        <div className={warningClasses}>
          <div className="mx-1"><WarningIcon /></div>
          <div>
            <h3 className="text-[18px] font-bold">
              {safeDaysLeft} {dayLabel} left
            </h3>
            <span>The Federal Comment Period ends on {formatDate(phaseEndDate)}</span>
          </div>
          <button
            data-testid="button-dismiss-warning"
            onClick={() => setShowWarning(false)}
            className="h-3 w-3 border-l border-border-rules cursor-pointer px-sm ml-auto"
            aria-label="Dismiss warning"
          >
            <ExitIcon className="w-3 h-3" width="12" height="12" />
          </button>
        </div>
      )}

      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">
        FEDERAL COMMENT PERIOD
      </h3>
      <p className="text-sm text-text-placeholder mb-4">
        Federal Comment Period Review. Find completeness guidelines online at <a
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
            onUploadClick={() => setUploadOpen(true)}
            onDeleteDocument={(id) => console.log(id)}
          />
          <VerifyCompleteSection />
        </div>
      </section>

      <FederalCommentUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        bundleId={demonstrationId}
      />
    </div>
  );
};
