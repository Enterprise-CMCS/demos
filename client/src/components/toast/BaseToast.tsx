import React from "react";
import { tw } from "tags/tw";
import { ExitIcon } from "components/icons/ExitIcon";

export type ToastType = "info" | "success" | "warning" | "error";

const BASE_TOAST_CLASSES = tw`
  w-[600px] p-sm rounded-md shadow-lg
  bg-white text-text-font border border-l-4
  flex items-start justify-between
  transition-all duration-300 ease-in-out
`;

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
  onDismiss?: () => void;
}

export const BaseToast: React.FC<BaseToastProps> = ({
  message,
  toastType,
  onDismiss,
}) => {
  const toastClasses = `${BASE_TOAST_CLASSES} ${getToastColor(toastType)}`;

  return (
    <div className={toastClasses} role="alert">
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="h-full border-l border-border-rules cursor-pointer px-sm"
        aria-label="Dismiss notification">
        <ExitIcon />
      </button>
    </div>
  );
};
