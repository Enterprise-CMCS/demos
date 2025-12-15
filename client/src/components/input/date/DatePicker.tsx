import React from "react";
import { Input } from "components/input/Input";

interface DatePickerProps {
  name: string;
  label: string;
  onChange?: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  getValidationMessage?: () => string | undefined;
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

  return (
    <Input
      type="date"
      name={name}
      label={label}
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
