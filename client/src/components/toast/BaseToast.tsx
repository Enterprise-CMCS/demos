import { ErrorIcon, ExitIcon, InfoIcon, SuccessIcon, WarningIcon } from "components/icons";
import React from "react";
import { tw } from "tags/tw";

export type ToastType = "info" | "success" | "warning" | "error";

const BASE_TOAST_CLASSES = tw`
  w-[600px] p-sm rounded-md shadow-lg
  bg-white text-text-font border border-l-4
  flex items-center justify-between
  transition-all duration-300 ease-in-out
  animate-fade-in
`;

const getToastIcon = (type: ToastType): React.ReactNode => {
  switch (type) {
    case "info":
      return <InfoIcon />;
    case "success":
      return <SuccessIcon />;
    case "warning":
      return <WarningIcon />;
    case "error":
      return <ErrorIcon />;
    default:
      throw new Error(`Unknown toast type: ${type}`);
  }
};

const getToastColor = (type: ToastType): string => {
  switch (type) {
    case "info":
      return "border-brand";
    case "success":
      return "border-border-success";
    case "warning":
      return "border-border-alert";
    case "error":
      return "border-border-warn";
    default:
      throw new Error(`Unknown toast type: ${type}`);
  }
};

interface BaseToastProps {
  message: string;
  toastType: ToastType;
  onDismiss: () => void;
}

export const BaseToast: React.FC<BaseToastProps> = ({
  message,
  toastType,
  onDismiss,
}) => {
  const toastClasses = `${BASE_TOAST_CLASSES} ${getToastColor(toastType)}`;
  const toastIcon = getToastIcon(toastType);

  return (
    <div className={toastClasses} role="alert">
      <div className="mx-1">{toastIcon}</div>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="h-3 w-3 border-l border-border-rules cursor-pointer px-sm ml-1"
        aria-label="Dismiss notification">
        <ExitIcon />
      </button>
    </div>
  );
};
