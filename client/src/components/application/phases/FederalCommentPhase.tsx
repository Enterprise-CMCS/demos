import React, { useMemo, useState } from "react";
import { tw } from "tags/tw";

import {
  ApplicationUploadSection,
  STYLES,
} from "components/application/phases/sections";
import { ExitIcon, WarningIcon } from "components/icons";
import { formatDate } from "util/formatDate";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { ConceptPreSubmissionUploadDialog } from "components/dialog/document/ConceptPreSubmissionUploadDialog";

interface FederalCommentPhaseProps {
  demonstrationId?: string;
  phaseStartDate: Date;
  phaseEndDate: Date
  documents?: DocumentTableDocument[];
}

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
    const now = new Date();

    // Remove time part for accurate day count
    phaseEndDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffMs = phaseEndDate.getTime() - now.getTime();
    const diffDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);

    return diffDays;
  }, [phaseEndDate]);

  const borderColorClass = daysLeft === 1 ? "border-border-warn" : "border-border-alert";
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
          <span>{formatDate(phaseStartDate)}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold">Federal Comment Period End Date</span>
          <span>{formatDate(phaseEndDate)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {showWarning && (
        <div className={warningClasses}>
          <div className="mx-1"><WarningIcon /></div>
          <div>
            <h3 className="text-[18px] font-bold">{daysLeft} {daysLeft === 1 ? "day" : "days"} left</h3>
            <span>The Federal Comment Period ends on {formatDate(phaseEndDate)}</span>
          </div>
          <button
            data-testid="button-dismiss-warning"
            onClick={() => setShowWarning(false)}
            className="h-3 w-3 border-l border-border-rules cursor-pointer px-sm ml-auto"
            aria-label="Dismiss warning"
          >
            <ExitIcon />
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

      <ConceptPreSubmissionUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        bundleId={demonstrationId}
      />
    </div>
  );
};
