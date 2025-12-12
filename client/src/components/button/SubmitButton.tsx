import React from "react";
import { Button } from "components/button";
import { Spinner } from "components/loading/Spinner";

const ButtonText = ({
  text,
  loadingText,
  isLoading,
}: {
  text: string;
  loadingText: string;
  isLoading: boolean;
}) => {
  const getButtonText = () => {
    if (isLoading) return loadingText;
    return text;
  };

  return (
    <>
      {isLoading && <Spinner />}
      {getButtonText()}
    </>
  );
};

interface SubmitButtonProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  name?: string;
  label?: string;
  loadingText?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  text = "Submit",
  onClick = () => {},
  disabled = false,
  isLoading = false,
  name = "button-submit",
  label = text,
  loadingText = "Loading",
}) => {
  return (
    <Button
      name={name}
      onClick={onClick}
      aria-label={label}
      aria-disabled={disabled || isLoading ? "true" : "false"}
      disabled={disabled || isLoading}
      data-testId={name}
    >
      <ButtonText text={text} loadingText={loadingText} isLoading={isLoading} />
    </Button>
  );
};
