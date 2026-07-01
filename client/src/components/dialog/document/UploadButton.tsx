import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

interface UploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isUploading: boolean;
  label?: string;
  loadingLabel?: string;
  "aria-label"?: string;
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
      {isUploading && (
        <span className="inline-flex size-[20px] shrink-0 items-center justify-center">
          <Spinner />
        </span>
      )}
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
  "aria-label": ariaLabel,
}) => {
  const resolvedAriaLabel = ariaLabel ?? `${label} Document`;
  return (
    <Button
      name="button-confirm-upload-document"
      onClick={onClick}
      aria-label={resolvedAriaLabel}
      aria-disabled={disabled || isUploading ? "true" : "false"}
      disabled={disabled || isUploading}
    >
      <ButtonText isUploading={isUploading} label={label} loadingLabel={loadingLabel} />
    </Button>
  );
};
