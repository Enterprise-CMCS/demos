import React from "react";

import { ErrorIcon, ExitIcon, InfoIcon, SuccessIcon, WarningIcon } from "components/icons";
import { tw } from "tags/tw";

export type NoticeVariant = "info" | "success" | "warning" | "error";

const COMMON_CLASSES = tw`flex items-center gap-2 px-1 py-1 text-sm
bg-white text-text-font border-l-[10px] border
`;

const DISMISS_BUTTON_CLASSES = tw`flex  items-center h-4 pr-1
border-l border-border-rules pl-2 text-text-placeholder cursor-pointer
`;

const VARIANT_TO_CLASSNAME: Record<NoticeVariant, string> = {
  info: tw`border-brand`,
  success: tw`border-border-success`,
  warning: tw`border-border-alert`,
  error: tw`border-border-warn`,
};

const VARIANT_TO_ICON: Record<NoticeVariant, React.ReactNode> = {
  info: <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
};

interface NoticeProps {
  title: string;
  description?: string;
  variant?: NoticeVariant;
  onDismiss?: () => void;
}

export const Notice: React.FC<NoticeProps> = ({
  title,
  description,
  variant = "info",
  onDismiss,
}) => {
  const variantClasses = VARIANT_TO_CLASSNAME[variant];
  const icon = VARIANT_TO_ICON[variant];

  return (
    <div role="status" aria-live="polite" className={`${COMMON_CLASSES} ${variantClasses}`}>
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
          className={DISMISS_BUTTON_CLASSES}
          aria-label="Dismiss notice"
        >
          <ExitIcon />
        </button>
      )}
    </div>
  );
};
