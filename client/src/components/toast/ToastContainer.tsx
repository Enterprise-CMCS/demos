import React from "react";
import { useToast, Toast } from "./ToastContext";
import { InfoToast } from "./InfoToast";
import { SuccessToast } from "./SuccessToast";
import { WarningToast } from "./WarningToast";
import { ErrorToast } from "./ErrorToast";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const renderToast = (toast: Toast) => {
    const commonProps = {
      key: toast.id,
      message: toast.message,
      onDismiss: () => removeToast(toast.id),
    };

    switch (toast.type) {
    case "info":
      return <InfoToast {...commonProps} />;
    case "success":
      return <SuccessToast {...commonProps} />;
    case "warning":
      return <WarningToast {...commonProps} />;
    case "error":
      return <ErrorToast {...commonProps} />;
    default:
      throw new Error(`Unknown toast type: ${toast.type}`);
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(renderToast)}
    </div>
  );
};
