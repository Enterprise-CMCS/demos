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
      message: toast.message,
      onDismiss: () => removeToast(toast.id),
    };

    switch (toast.type) {
      case "info":
        return <InfoToast key={toast.id} {...commonProps} />;
      case "success":
        return <SuccessToast key={toast.id} {...commonProps} />;
      case "warning":
        return <WarningToast key={toast.id} {...commonProps} />;
      case "error":
        return <ErrorToast key={toast.id} {...commonProps} />;
      default:
        throw new Error(`Unknown toast type: ${toast.type}`);
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-5 left-1/2 transform -translate-x-1/2 z-13 space-y-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(renderToast)}
    </div>
  );
};
