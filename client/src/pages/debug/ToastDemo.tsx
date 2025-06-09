import React from "react";
import { useToast } from "components/toast";
import { PrimaryButton, WarningButton, ErrorButton } from "components";

export const ToastDemo: React.FC = () => {
  const { showInfo, showSuccess, showWarning, showError } = useToast();

  const handleInfoToast = () => {
    showInfo("This is an informational message. It provides helpful context about what's happening in the application.");
  };

  const handleSuccessToast = () => {
    showSuccess("Operation completed successfully! Your changes have been saved and are now active.");
  };

  const handleWarningToast = () => {
    showWarning("Warning: This action cannot be undone. Please review your selections before proceeding.");
  };

  const handleErrorToast = () => {
    showError("Error: Unable to process your request. Please check your internet connection and try again.");
  };

  return (
    <>
      <div className="flex gap-sm">
        <PrimaryButton onClick={handleInfoToast}>
              Show Info Toast
        </PrimaryButton>

        <PrimaryButton onClick={handleSuccessToast}>
              Show Success Toast
        </PrimaryButton>

        <WarningButton onClick={handleWarningToast}>
              Show Warning Toast
        </WarningButton>

        <ErrorButton onClick={handleErrorToast}>
              Show Error Toast
        </ErrorButton>
      </div>
    </>
  );
};
