import React from "react";
import { HomeIcon, ReviewIcon, SaveIcon, OnHoldIcon, UndoIcon, SubmitIcon } from "icons";
import { tw } from "tags/tw";
import type { ApplicationStatus } from "demos-server";

const BASE_STYLES = tw`whitespace-nowrap h-full min-h-3 flex items-center gap-xs ml-auto text-lg`;

export const DemonstrationStatusBadge = ({
  demonstrationStatus,
}: {
  demonstrationStatus: ApplicationStatus;
}) => {
  let statusNode;
  switch (demonstrationStatus) {
    case "Pre-Submission":
      statusNode = (
        <>
          <SubmitIcon className="text-text-placeholder min-h-2 h-full w-full" /> Pre-Submission
        </>
      );
      break;
    case "Under Review":
      statusNode = (
        <>
          <ReviewIcon className="text-border-alert min-h-2 h-full w-full" /> Under Review
        </>
      );
      break;
    case "Approved":
      statusNode = (
        <>
          <SaveIcon className="text-border-success min-h-2 h-full w-full" /> Approved
        </>
      );
      break;
    case "Denied":
      statusNode = (
        <>
          <HomeIcon className="text-error min-h-2 h-full w-full" /> Denied
        </>
      );
      break;
    case "Withdrawn":
      statusNode = (
        <>
          <UndoIcon className="text-text-placeholder min-h-2 h-full w-full" /> Withdrawn
        </>
      );
      break;
    case "On-hold":
      statusNode = (
        <>
          <OnHoldIcon className="text-border-alert min-h-2 h-full w-full" /> On-hold
        </>
      );
      break;
  }

  return <div className={BASE_STYLES}>{statusNode}</div>;
};
