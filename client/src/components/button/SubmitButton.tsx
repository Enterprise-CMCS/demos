import React from "react";
import { BaseActionButton } from "components/button/BaseActionButton";

const BUTTON_TEXT = "Submit";
const BUTTON_LOADING_TEXT = "Loading";
const BUTTON_NAME = "button-submit";
const BUTTON_LABEL = "Submit";

interface SubmitButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSubmitting: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ onClick, disabled, isSubmitting }) => {
  return (
    <BaseActionButton
      text={BUTTON_TEXT}
      submittingText={BUTTON_LOADING_TEXT}
      onClick={onClick}
      disabled={disabled}
      isSubmitting={isSubmitting}
      name={BUTTON_NAME}
      label={BUTTON_LABEL}
    />
  );
};
