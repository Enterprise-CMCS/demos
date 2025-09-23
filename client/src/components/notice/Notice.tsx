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

const BASE_NOTICE = tw`flex items-center gap-2 border-l-[10px] border px-1 py-1 text-sm w-1/2`;

const VARIANT_TO_CLASSNAME: Record<NoticeVariant, string> = {
  info: tw`bg-blue-50 border-brand text-text-font`,
  success: tw`bg-green-50 border-border-success text-text-font`,
  warning: tw`bg-white border-border-alert text-text-font`,
  error: tw`bg-red-50 border-border-warn text-text-font`,
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
      className={`${BASE_NOTICE} ${variantClasses} ${className ?? ""}`.trim()}
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
