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

const BASE_NOTICE = tw`flex items-start gap-3 rounded-md border px-4 py-3 text-sm`;

const VARIANT_TO_CLASSNAME: Record<NoticeVariant, string> = {
  info: tw`bg-blue-50 border-brand text-text-font`,
  success: tw`bg-green-50 border-border-success text-text-font`,
  warning: tw`bg-yellow-50 border-border-alert text-text-font`,
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
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-semibold text-base leading-5">{title}</p>
        {description && <p className="mt-1 text-sm leading-5 text-text-placeholder">{description}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-4 h-6 border-l border-border-rules pl-3 text-text-placeholder transition-colors hover:text-text-font focus:outline-none focus:ring-2 focus:ring-action-focus focus:ring-offset-2"
          aria-label="Dismiss notice"
        >
          <ExitIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
