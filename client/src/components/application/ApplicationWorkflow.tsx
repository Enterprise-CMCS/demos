import { HomeIcon, ReviewIcon, SaveIcon } from "components/icons";
import React from "react";
import { PhaseSelector } from "./PhaseSelector";

type DemonstrationStatus = "under_review" | "approved" | "rejected";

const STYLES = {
  DEMONSTRATION_STATUS_BADGE:
    "whitespace-nowrap h-full min-h-3 flex items-center gap-xs ml-auto text-lg",
};

const DemonstrationStatusBadge = ({
  demonstrationStatus,
}: {
  demonstrationStatus: DemonstrationStatus;
}) => {
  let statusNode;

  switch (demonstrationStatus) {
    case "under_review":
      statusNode = (
        <>
          <ReviewIcon className="text-border-alert min-h-2 h-full w-full" /> Under Review
        </>
      );
      break;
    case "approved":
      statusNode = (
        <>
          <SaveIcon className="text-border-success min-h-2 h-full w-full" /> Approved
        </>
      );
      break;
    case "rejected":
      statusNode = (
        <>
          <HomeIcon className="text-error min-h-2 h-full w-full" /> Rejected
        </>
      );
      break;
  }

  return <div className={STYLES.DEMONSTRATION_STATUS_BADGE}>{statusNode}</div>;
};

export interface ApplicationWorkflowDemonstration {
  status: DemonstrationStatus;
}

export const ApplicationWorkflow = ({
  demonstration,
}: {
  demonstration: ApplicationWorkflowDemonstration;
}) => {
  return (
    <div className="flex flex-col gap-sm">
      <div className="flex w-full">
        <h3 className="text-brand text-2xl font-bold">APPLICATION</h3>
        <DemonstrationStatusBadge demonstrationStatus={demonstration.status} />
      </div>
      <hr className="text-border-rules" />
      <PhaseSelector />
    </div>
  );
};
