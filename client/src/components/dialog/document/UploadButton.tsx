import React from "react";
import { SubmitButton } from "components/button/SubmitButton";

const BUTTON_TEXT = "Upload";
const BUTTON_LOADING_TEXT = "Uploading";
const BUTTON_NAME = "button-confirm-upload-document";
const BUTTON_LABEL = "Upload Document";

interface UploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isUploading: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onClick, disabled, isUploading }) => {
  return (
    <SubmitButton
      text={BUTTON_TEXT}
      submittingText={BUTTON_LOADING_TEXT}
      onClick={onClick}
      disabled={disabled}
      isSubmitting={isUploading}
      name={BUTTON_NAME}
      label={BUTTON_LABEL}
    />
  );
};
