import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

const SUBMIT_BUTTON_TEXT = "Submit";
const SUBMIT_BUTTON_LABEL = "Submit";
const SUBMIT_BUTTON_LOADING_TEXT = "Loading";

interface SubmitButtonProps {
  name: string;
  onClick: () => void;
  disabled?: boolean;
  isSubmitting: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  name,
  onClick,
  disabled,
  isSubmitting,
}) => {
  return (
    <Button
      name={name}
      onClick={onClick}
      aria-label={SUBMIT_BUTTON_LABEL}
      aria-disabled={disabled || isSubmitting ? "true" : "false"}
      disabled={disabled || isSubmitting}
    >
      {isSubmitting && <Spinner />}
      {isSubmitting ? SUBMIT_BUTTON_LOADING_TEXT : SUBMIT_BUTTON_TEXT}
    </Button>
  );
};
