import React from "react";
import { HomeIcon, ReviewIcon, SaveIcon } from "icons";
import { tw } from "tags/tw";
import { DemonstrationStatus } from "./ApplicationWorkflow";

const BASE_STYLES =
  tw`whitespace-nowrap h-full min-h-3 flex items-center gap-xs ml-auto text-lg`;

export const DemonstrationStatusBadge = ({
  demonstrationStatus,
}: {
  demonstrationStatus: DemonstrationStatus;
}) => {
  let statusNode;
  switch (demonstrationStatus) {
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
          <HomeIcon className="text-error min-h-2 h-full w-full" /> Rejected
        </>
      );
      break;
  }

  return <div className={BASE_STYLES}>{statusNode}</div>;
};
