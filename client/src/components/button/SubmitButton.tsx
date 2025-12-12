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
  isSubmitting: boolean;
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
  onClick?: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  name?: string;
  label?: string;
  submittingText?: string;
  form?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text = "Submit",
  onClick = () => {},
  disabled = false,
  isSubmitting = false,
  name = "button-submit",
  label = text,
  submittingText = "Loading",
  form,
}) => {
  return (
    <Button
      name={name}
      onClick={onClick}
      ariaLabel={label}
      aria-disabled={disabled || isSubmitting ? "true" : "false"}
      disabled={disabled || isSubmitting}
      data-testId={name}
      type="submit"
      form={form}
    >
      <ButtonText text={text} submittingText={submittingText} isSubmitting={isSubmitting} />
    </Button>
  );
};
