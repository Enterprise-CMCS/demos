import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

interface UploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isUploading: boolean;
  label?: string;
  loadingLabel?: string;
  ariaLabel?: string;
}

const ButtonText = ({
  isUploading,
  label,
  loadingLabel,
}: {
  isUploading: boolean;
  label: string;
  loadingLabel: string;
}) => {
  const getButtonText = () => {
    if (isUploading) return loadingLabel;
    return label;
  };

  return (
    <>
      {isUploading && <Spinner />}
      {getButtonText()}
    </>
  );
};

export const UploadButton: React.FC<UploadButtonProps> = ({
  onClick,
  disabled,
  isUploading,
  label = "Upload",
  loadingLabel = "Uploading",
  ariaLabel,
}) => {
  const resolvedAriaLabel = ariaLabel ?? `${label} Document`;
  return (
    <Button
      name="button-confirm-upload-document"
      onClick={onClick}
      ariaLabel={resolvedAriaLabel}
      aria-disabled={disabled || isUploading ? "true" : "false"}
      disabled={disabled || isUploading}
    >
      <ButtonText isUploading={isUploading} label={label} loadingLabel={loadingLabel} />
    </Button>
  );
};
