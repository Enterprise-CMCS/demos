import React from "react";
import { tw } from "tags/tw";
import { ApplicationUploadSection } from "components/application/phases/sections";
import { formatDate, formatDateForServer } from "util/formatDate";
import { DocumentTableDocument } from "components/table/tables/DocumentTable";
import { useDialog } from "components/dialog/DialogContext";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { DueDateNotice } from "components/application/phases/sections/DueDateNotice";

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

  return (
    <FederalCommentPhase
      demonstrationId={demonstration.id}
      phaseComplete={phaseComplete}
      phaseStartDate={phaseStartDate?.dateValue ? formatDate(phaseStartDate.dateValue) : ""}
      phaseEndDate={phaseEndDate?.dateValue ? formatDate(phaseEndDate.dateValue) : ""}
    />
  );
};

export const FederalCommentPhase: React.FC<FederalCommentPhaseProps> = ({
  demonstrationId = "default-demo-id",
  phaseStartDate,
  phaseEndDate,
  phaseComplete,
  documents = [],
}) => {
  const { showFederalCommentDocumentUploadDialog } = useDialog();

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
      <div className="flex flex-col gap-6">
        {phaseEndDate && (
          <DueDateNotice
            dueDate={formatDateForServer(phaseEndDate)}
            phaseComplete={phaseComplete}
            shouldPhaseBeAutomaticallyDismissedIfPhaseIsComplete={true}
            descriptionToAppendDateTo="The Federal Comment Period ends on"
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
