import React from "react";

import { ErrorIcon, ExitIcon, InfoIcon, SuccessIcon, WarningIcon } from "components/icons";
import { tw } from "tags/tw";

export type NoticeVariant = "info" | "success" | "warning" | "error";

interface NoticeProps {
  title: string;
  description?: string;
  variant?: NoticeVariant;
  onDismiss?: () => void;
  className?: string;
}
// If these need to change, simplely remove from common and add to each variant.
const COMMON_CLASSES = tw`bg-white text-text-font flex
  items-center gap-2 border-l-[10px] border px-1 py-1 text-sm w-1/2
`;
const VARIANT_TO_CLASSNAME: Record<NoticeVariant, string> = {
  info: `${COMMON_CLASSES} ${tw`border-border-brand`}`,
  success: `${COMMON_CLASSES} ${tw`border-border-success`}`,
  warning: `${COMMON_CLASSES} ${tw`border-border-alert`}`,
  error: `${COMMON_CLASSES} ${tw`border-border-warn`}`,
};

const VARIANT_TO_ICON: Record<NoticeVariant, React.ReactNode> = {
  info: <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

export const Notice: React.FC<NoticeProps> = ({
  title,
  description,
  variant = "info",
  onDismiss,
  className,
}) => {
  const variantClasses = VARIANT_TO_CLASSNAME[variant];
  const icon = VARIANT_TO_ICON[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${variantClasses} ${className ?? ""}`.trim()}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 leading-2">
        <p className="text-[15px] font-bold text-text-font">{title}</p>
        {description && <p className="text-sm text-text-placeholder">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-4 pr-1 items-center border-l border-border-rules pl-2
          text-text-placeholder transition-colors hover:text-text-font focus:outline-none
          focus:ring-2 focus:ring-action-focus focus:ring-offset-2"
          aria-label="Dismiss notice"
        >
          <ExitIcon />
        </button>
      )}
    </div>
  );
};
