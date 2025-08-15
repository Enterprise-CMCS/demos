import React from "react";
import { useToast } from "components/toast";
import { Button, WarningButton, ErrorButton } from "components";

export const ToastDemo: React.FC = () => {
  const { showInfo, showSuccess, showWarning, showError } = useToast();

  const handleInfoToast = () => {
    showInfo("This is a short informational message.");
  };

  const handleSuccessToast = () => {
    showSuccess(
      "Operation completed successfully! Your changes have been saved and are now active."
    );
  };

  const handleWarningToast = () => {
    showWarning(
      "Warning: This action cannot be undone. Please review your selections before proceeding. This is a longer warning message with some added details"
    );
  };

  const handleErrorToast = () => {
    showError(
      "Error: Unable to process your request. Please check your internet connection and try again. This message is even longer intended to get the text to wrap to multiple lines to test the layout of the error toast component."
    );
  };

  return (
    <>
      <div className="flex gap-sm">
        <Button onClick={handleInfoToast}>Show Info Toast</Button>

        <Button onClick={handleSuccessToast}>Show Success Toast</Button>

        <WarningButton onClick={handleWarningToast}>Show Warning Toast</WarningButton>

        <ErrorButton onClick={handleErrorToast}>Show Error Toast</ErrorButton>
      </div>
    </>
  );
};
