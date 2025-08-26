import { useState } from "react";

import { useToast } from "components/toast";

export type DialogFormStatus = "idle" | "pending";

// Shared utility functions for dialog form data transformation
export const createFormDataWithDates = <T extends Record<string, unknown>>(
  baseData: T,
  effectiveDate?: string,
  expirationDate?: string
): T & { effectiveDate?: Date; expirationDate?: Date } => ({
    ...baseData,
    ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
    ...(expirationDate && { expirationDate: new Date(expirationDate) }),
  });

export const createSuccessMessages = (addMessage: string, editMessage: string) => ({
  add: addMessage,
  edit: editMessage,
});

export interface UseDialogFormProps<T = Record<string, unknown>> {
  mode: "add" | "edit";
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  validateForm: () => boolean;
  getFormData: () => T;
  successMessage?: {
    add: string;
    edit: string;
  };
  errorMessage?: string;
}

export const useDialogForm = <T = Record<string, unknown>>({
  mode,
  onClose,
  onSubmit,
  validateForm,
  getFormData,
  successMessage = {
    add: "Created successfully!",
    edit: "Updated successfully!",
  },
  errorMessage = "Failed to save. Please try again.",
}: UseDialogFormProps<T>) => {
  const [formStatus, setFormStatus] = useState<DialogFormStatus>("idle");
  const [showWarning, setShowWarning] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setShowWarning(true);
      showError("Please complete all required fields.");
      return;
    }

    setShowWarning(false);
    setFormStatus("pending");

    try {
      const formData = getFormData();
      await onSubmit(formData);

      showSuccess(mode === "edit" ? successMessage.edit : successMessage.add);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      showError(errorMessage);
    } finally {
      setFormStatus("idle");
    }
  };

  return {
    formStatus,
    showWarning,
    showCancelConfirm,
    setShowCancelConfirm,
    handleSubmit,
    isFormPending: formStatus === "pending",
  };
};
