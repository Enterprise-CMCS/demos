import React, { useState } from "react";
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

const isInvalidDirtyState = (value: string, isDirty: boolean, isRequired?: boolean): boolean => {
  if (!isDirty) return false;
  if (isRequired && !value) return true;
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  if (value && isNaN(new Date(value).getTime())) return true;
  return false;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  isRequired,
  isDisabled,
  getValidationMessage,
}) => {
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    onChange?.(e.target.value);
  };

  const handleBlur = () => {
    setIsDirty(true);
  };

  // Show red label when dirty and invalid
  const isInvalidState = isInvalidDirtyState(value || "", isDirty, isRequired);
  const labelClasses = isInvalidState ? "text-error-dark font-semibold text-field-label flex gap-0-5" : undefined;

  return (
    <Input
      type="date"
      name={name}
      label={label}
      labelClasses={labelClasses}
      value={value || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      isRequired={isRequired ?? false}
      isDisabled={isDisabled ?? false}
      getValidationMessage={getValidationMessage}
    />
  );
};
