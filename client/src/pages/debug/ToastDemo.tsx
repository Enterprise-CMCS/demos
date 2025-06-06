import React from "react";
import { useToast } from "components/toast";
import { PrimaryButton, SecondaryButton, WarningButton, ErrorButton } from "components";

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

  const handleCustomDurationToast = () => {
    showInfo("This toast will disappear in 10 seconds instead of the default 5 seconds.", 10000);
  };

  const handlePersistentToast = () => {
    showError("This toast will stay until manually dismissed.", 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Toast Components Demo</h2>
        <p className="text-gray-600 mb-6">
          Click the buttons below to see different types of toast notifications.
          Toasts will appear in the top-right corner of the screen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Basic Toast Types</h3>

          <div className="flex flex-col gap-2">
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
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Custom Duration Options</h3>

          <div className="flex flex-col gap-2">
            <SecondaryButton onClick={handleCustomDurationToast}>
              Show 10 Second Toast
            </SecondaryButton>

            <SecondaryButton onClick={handlePersistentToast}>
              Show Persistent Toast
            </SecondaryButton>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold mb-2">How to Use</h3>
        <div className="space-y-2 text-sm">
          <p><strong>1. Wrap your app with ToastProvider:</strong></p>
          <code className="block bg-white p-2 rounded text-xs">
            {`<ToastProvider>
  <App />
  <ToastContainer />
</ToastProvider>`}
          </code>

          <p><strong>2. Use the useToast hook in components:</strong></p>
          <code className="block bg-white p-2 rounded text-xs">
            {`const { showInfo, showSuccess, showWarning, showError } = useToast();
showSuccess("Operation completed!");`}
          </code>
        </div>
      </div>
    </div>
  );
};
