import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

const ButtonText = ({
  text,
  submittingText,
  isSubmitting,
}: {
  text: string;
  submittingText: string;
  isSubmitting?: boolean;
}) => {
  const getButtonText = () => {
    if (isSubmitting) return submittingText;
    return text;
  };

  return (
    <>
      {isSubmitting && <Spinner />}
      {getButtonText()}
    </>
  );
};

interface SubmitButtonProps {
  text?: string;
  name?: string;
  label?: string;
  submittingText?: string;
  onClick?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text = "Submit",
  name = "button-submit",
  label = text,
  submittingText = "Loading",
  onClick,
  disabled,
  isSubmitting,
}) => {
  return (
    <Button
      name={name}
      onClick={onClick}
      ariaLabel={label}
      aria-disabled={disabled || isSubmitting ? "true" : "false"}
      disabled={disabled || isSubmitting}
      data-testId={name}
    >
      <ButtonText text={text} submittingText={submittingText} isSubmitting={isSubmitting} />
    </Button>
  );
};
