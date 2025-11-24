import React from "react";
import { Input } from "components/input/Input";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: string;
  required?: boolean;
  value?: string;
  onValueChange?: (newDate: string) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  id,
  required,
  value,
  onValueChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(e.target.value);
  };

  return (
    <Input
      type="date"
      label={label}
      name={name}
      id={id}
      isRequired={required ?? false}
      value={value}
      onChange={handleChange}
    />
  );
};
