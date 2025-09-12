import React from "react";
import { HomeIcon, ReviewIcon, SaveIcon, OnHoldIcon, UndoIcon, SubmitIcon } from "icons";
import { tw } from "tags/tw";
import { DEMONSTRATION_STATUSES } from "demos-server-constants";

type DemonstrationStatusId = (typeof DEMONSTRATION_STATUSES)[number]["id"];

const BASE_STYLES =
  tw`whitespace-nowrap h-full min-h-3 flex items-center gap-xs ml-auto text-lg`;

export const DemonstrationStatusBadge = ({
  demonstrationStatus,
}: {
  demonstrationStatus: DemonstrationStatusId;
}) => {
  let statusNode;
  switch (demonstrationStatus) {
    case "DEMONSTRATION_PRE-SUBMISSION":
      statusNode = (
        <>
          <SubmitIcon className="text-text-placeholder min-h-2 h-full w-full" /> Pre-Submission
        </>
      );
      break;
    case "DEMONSTRATION_UNDER_REVIEW":
      statusNode = (
        <>
          <ReviewIcon className="text-border-alert min-h-2 h-full w-full" /> Under Review
        </>
      );
      break;
    case "DEMONSTRATION_APPROVED":
      statusNode = (
        <>
          <SaveIcon className="text-border-success min-h-2 h-full w-full" /> Approved
        </>
      );
      break;
    case "DEMONSTRATION_DENIED":
      statusNode = (
        <>
          <HomeIcon className="text-error min-h-2 h-full w-full" /> Denied
        </>
      );
      break;
    case "DEMONSTRATION_WITHDRAWN":
      statusNode = (
        <>
          <UndoIcon className="text-text-placeholder min-h-2 h-full w-full" /> Withdrawn
        </>
      );
      break;
    case "DEMONSTRATION_ON-HOLD":
      statusNode = (
        <>
          <OnHoldIcon className="text-border-alert min-h-2 h-full w-full" /> On-hold
        </>
      );
      break;
  }

  return <div className={BASE_STYLES}>{statusNode}</div>;
};
