import React from "react";
import { Input } from "components/input/Input";

interface DatePickerProps {
  name: string;
  label: string;
  onChange: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  isRequired,
}) => {
  // This is only triggered when the input value is a valid date string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      type="date"
      name={name}
      label={label}
      value={value || ""}
      isRequired={isRequired ?? false}
      onChange={handleChange}
    />
  );
};
