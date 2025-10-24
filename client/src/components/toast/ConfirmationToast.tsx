import React from "react";

import { ErrorButton, SecondaryButton } from "components/button";

interface ConfirmationToastProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationToast: React.FC<ConfirmationToastProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
}) => {
  return (
    <dialog
      ref={(ref) => ref?.showModal()}
      className="bg-white border border-gray-300 rounded p-2 w-[400px] shadow-md text-center backdrop:bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <p className="text-sm font-bold mb-4 text-gray-900">{message}</p>
      <div className="flex justify-center gap-6">
        <SecondaryButton name="confirmation-cancel" size="small" onClick={onCancel}>
          {cancelText}
        </SecondaryButton>
        <ErrorButton name="confirmation-confirm" isOutlined={true} size="small" onClick={onConfirm}>
          {confirmText}
        </ErrorButton>
      </div>
    </dialog>
  );
};
