import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

interface UploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isUploading: boolean;
}

const ButtonText = ({ isUploading }: { isUploading: boolean }) => {
  const getButtonText = () => {
    if (isUploading) return "Uploading";
    return "Upload";
  };

  return (
    <>
      {isUploading && <Spinner />}
      {getButtonText()}
    </>
  );
};

export const UploadButton: React.FC<UploadButtonProps> = ({ onClick, disabled, isUploading }) => {
  return (
    <Button
      name="button-confirm-upload-document"
      onClick={onClick}
      aria-label="Upload Document"
      aria-disabled={disabled || isUploading ? "true" : "false"}
      disabled={disabled || isUploading}
    >
      <ButtonText isUploading={isUploading} />
    </Button>
  );
};
