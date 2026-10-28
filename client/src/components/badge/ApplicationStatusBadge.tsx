import React from "react";
import {
  EmptyIcon,
  OnHoldIcon,
  PreSubmissionIcon,
  ReviewIcon,
  SuccessInvertedIcon,
  WithdrawnIcon,
} from "icons";
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

const STATUS_ICONS = {
  "Pre-Submission": { Icon: PreSubmissionIcon, color: "text-text-placeholder" },
  "Under Review": { Icon: ReviewIcon, color: "text-border-alert" },
  Approved: { Icon: SuccessInvertedIcon, color: "text-border-success" },
  Denied: { Icon: EmptyIcon, color: "text-error" },
  Withdrawn: { Icon: WithdrawnIcon, color: "text-text-placeholder" },
  "On-hold": { Icon: OnHoldIcon, color: "text-text-placeholder" },
} satisfies Record<ApplicationStatus, { Icon: typeof PreSubmissionIcon; color: string }>;

export const ApplicationStatusBadge = ({
  applicationStatus,
  size = "default",
  children,
}: {
  applicationStatus: ApplicationStatus;
  size?: DemonstrationStatusBadgeSize;
  children?: React.ReactNode;
}) => {
  const sizeClasses = SIZE_CLASSES[size];
  const { Icon, color } = STATUS_ICONS[applicationStatus];

  return (
    <div className={`${BASE_STYLES} ${sizeClasses.container}`}>
      <Icon className={`${color} ${sizeClasses.icon}`} />
      <span>{children ?? applicationStatus}</span>
    </div>
  );
};
