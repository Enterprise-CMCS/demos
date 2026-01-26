import React from "react";
import { EmptyIcon, OnHoldIcon, PreSubmissionIcon, ReviewIcon, SuccessInvertedIcon, WithdrawnIcon } from "icons";
import { tw } from "tags/tw";
import type { ApplicationStatus } from "demos-server";

const BASE_STYLES = tw`whitespace-nowrap h-full min-h-3 flex items-center gap-xs ml-auto`;

type DemonstrationStatusBadgeSize = "default" | "small";

const SIZE_CLASSES: Record<DemonstrationStatusBadgeSize, { container: string; icon: string }> = {
  default: {
    container: "text-lg",
    icon: "min-h-2 h-full w-full",
  },
  small: {
    container: "text-sm",
    icon: "w-2 h-2",
  },
};

export const DemonstrationStatusBadge = ({
  demonstrationStatus,
  size = "default",
}: {
  demonstrationStatus: ApplicationStatus;
  size?: DemonstrationStatusBadgeSize;
}) => {
  const sizeClasses = SIZE_CLASSES[size];
  let statusNode;
  switch (demonstrationStatus) {
    case "Pre-Submission":
      statusNode = (
        <>
          <PreSubmissionIcon className={`text-text-placeholder ${sizeClasses.icon}`} />
          Pre-Submission
        </>
      );
      break;
    case "Under Review":
      statusNode = (
        <>
          <ReviewIcon className={`text-border-alert ${sizeClasses.icon}`} /> Under Review
        </>
      );
      break;
    case "Approved":
      statusNode = (
        <>
          <SuccessInvertedIcon className={`text-border-success ${sizeClasses.icon}`} /> Approved
        </>
      );
      break;
    case "Denied":
      statusNode = (
        <>
          <EmptyIcon className={`text-error ${sizeClasses.icon}`} /> Denied
        </>
      );
      break;
    case "Withdrawn":
      statusNode = (
        <>
          <WithdrawnIcon className={`text-text-placeholder ${sizeClasses.icon}`} /> Withdrawn
        </>
      );
      break;
    case "On-hold":
      statusNode = (
        <>
          <OnHoldIcon className={`text-text-placeholder ${sizeClasses.icon}`} /> On-hold
        </>
      );
      break;
  }

  return <div className={`${BASE_STYLES} ${sizeClasses.container}`}>{statusNode}</div>;
};
