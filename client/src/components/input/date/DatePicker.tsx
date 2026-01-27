import React from "react";
import { Input } from "components/input/Input";
import { tw } from "tags/tw";

const REQUIRED_ASTERISK_CLASSES = tw`text-text-warn mr-xs`;
const LABEL_VALID_CLASSES = tw`font-bold text-sm tracking-wide h-[14px] flex items-center text-text-font`;
const LABEL_INVALID_CLASSES = tw`font-bold text-sm tracking-wide h-[14px] flex items-center text-error-dark`;

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <>
    <span className={REQUIRED_ASTERISK_CLASSES}>*</span>
    {" "}
    {children}
  </>
);

interface DatePickerProps {
  name: string;
  label: string;
  onChange?: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  getValidationMessage?: () => string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  isRequired,
  isDisabled,
  getValidationMessage,
}) => {
  // This is only triggered when the input value is a valid date string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const showVisualValidation = isRequired && !getValidationMessage; // Only show if no custom validation
  const labelContent = showVisualValidation && isRequired ? <RequiredLabel>{label}</RequiredLabel> : label;

  const labelClasses = showVisualValidation
    ? (value ? LABEL_VALID_CLASSES : LABEL_INVALID_CLASSES)
    : undefined;

  return (
    <Input
      type="date"
      name={name}
      label={labelContent}
      labelClasses={labelClasses}
      value={value || ""}
      onChange={handleChange}
      isRequired={isRequired ?? false}
      aria-required={isRequired ? "true" : "false"}
      isDisabled={isDisabled ?? false}
      aria-disabled={isDisabled ? "true" : "false"}
      getValidationMessage={getValidationMessage}
    />
  );
};
