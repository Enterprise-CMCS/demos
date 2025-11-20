import React from "react";
import { parseISO, isValid } from "date-fns";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  /** Raw string value in "YYYY-MM-DD" format (from <input type="date">) */
  value: string;
  /** Called on every change with the raw string value */
  onValueChange?: (value: string) => void;
  /**
   * Called only when the value represents a complete, valid date
   * and the year is >= minYear. Otherwise called with null.
   */
  onDateChange?: (date: Date | null) => void;
  /** Minimum year considered "sane" (default: 2000) */
  minYear?: number;
  /** Extra classes for the <input> */
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
  minYear = 1900, // this was hitting 0002 in the year and calling that good and validating it...
  className = "",
  inputClassName = "",
  required,
  ...rest
}) => {
  const inputId = id ?? name;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Always bubble the raw string value
    onValueChange?.(newValue);

    // Optionally bubble the parsed Date (or null) if the consumer cares
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
