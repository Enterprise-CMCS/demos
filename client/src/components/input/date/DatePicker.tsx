import React from "react";
import { parseISO, isValid } from "date-fns";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  value: string;
  onValueChange?: (value: string) => void;
  onDateChange?: (date: Date | null) => void;
  minYear?: number;
  inputClassName?: string;
}

/**
 * Helper: only return a Date when the string is a complete ISO "YYYY-MM-DD"
 * and the year is >= minYear. Otherwise, return null.
 */
const toDateIfCompleteAndSane = (value: string, minYear: number): Date | null => {
  if (!value) return null;

  // HTML date input uses "YYYY-MM-DD" (10 chars)
  if (value.length < 10) return null;

  const [yearStr] = value.split("-");
  const year = Number(yearStr);
  if (!year || year < minYear) return null;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  id,
  name,
  value,
  onValueChange,
  onDateChange,
  minYear = 1900,
  className = "",
  inputClassName = "",
  required,
  ...rest
}) => {
  const inputId = id ?? name;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange?.(newValue);
    if (onDateChange) {
      const date = toDateIfCompleteAndSane(newValue, minYear);
      onDateChange(date);
    }
  };

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold mb-1"
        >
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}

      <input
        id={inputId}
        min="1900-01-01"
        name={name}
        type="date"
        value={value}
        onChange={handleChange}
        className={`w-full border border-border-fields px-1 py-1 text-sm rounded ${inputClassName}`}
        required={required}
        {...rest}
      />
    </div>
  );
};
