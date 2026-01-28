import React from "react";
import { Input } from "components/input/Input";

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
      isDisabled={isDisabled ?? false}
      getValidationMessage={getValidationMessage}
    />
  );
};
