import React from "react";
import { CloseIcon } from "components/icons/CloseIcon";
import { tw } from "tags/tw";

export type ToastType = "info" | "success" | "warning" | "error";

const BASE_TOAST_CLASSES = tw`
    min-w-80 max-w-md p-4 mb-3 rounded-md shadow-lg 
    flex items-start justify-between gap-3
    transition-all duration-300 ease-in-out
`;

// TODO: use real colors from figma
const getToastColor = (type: ToastType): string => {
  switch (type) {
  case "info":
    return "bg-blue-50 text-blue-800";
  case "success":
    return "bg-green-50 text-green-800";
  case "warning":
    return "bg-yellow-50 text-yellow-800";
  case "error":
    return "bg-red-50 text-red-800";
  default:
    return "bg-gray-50 text-gray-800";
  }
};

interface BaseToastProps {
  message: string;
  toastType: ToastType;
}

export const BaseToast: React.FC<BaseToastProps> = ({
  message,
  toastType,
}) => {
  // TODO: Implement onDismiss functionality
  const onDismiss = () => {};
  const toastClasses = `${BASE_TOAST_CLASSES} ${getToastColor(toastType)}`;

  return (
    <div className={toastClasses} role="alert">
      <div className="flex-1 text-body leading-relaxed">
        {message}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss notification">
        <CloseIcon />
      </button>
    </div>
  );
};
