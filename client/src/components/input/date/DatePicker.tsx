import React, { useEffect, useRef } from "react";
import {
  getInputColors,
  INPUT_BASE_CLASSES,
  LABEL_CLASSES,
  VALIDATION_MESSAGE_CLASSES,
} from "components/input/Input";
import { parseISO } from "date-fns";
import { formatDate } from "util/formatDate";

const DEFAULT_MIN_DATE = "1900-01-01";
const DEFAULT_MAX_DATE = "2099-12-31";

interface DatePickerProps {
  name: string;
  label: string;
  onChange?: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  minDate?: string;
  maxDate?: string;
  getValidationMessage?: () => string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  isRequired,
  isDisabled,
  minDate,
  maxDate,
  getValidationMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputMin = minDate ?? DEFAULT_MIN_DATE;
  const inputMax = maxDate ?? DEFAULT_MAX_DATE;

  // The input is uncontrolled (defaultValue + ref-sync) instead of fully controlled.
  // Native <input type="date"> fires input events with value="" while the user is mid-typing the
  // year subfield (the date is briefly incomplete). A controlled input would re-render on every
  // such event and wipe the in-progress digits. With this ref-sync pattern, React only touches
  // the DOM when the value prop changes externally.
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (value ?? "")) {
      inputRef.current.value = value ?? "";
    }
  }, [value]);

  // Always propagate exactly what the user typed/picked, including "". Range is enforced by the
  // native min/max attributes below and surfaced via the validation message; out-of-range values
  // are never silently dropped, so what the user sees always matches what the parent holds.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  // Default out-of-range message, consistent with the native (inclusive) min/max bounds.
  // A caller-supplied getValidationMessage always takes precedence. Native <input type="date">
  // emits well-formed YYYY-MM-DD or "", so an ISO string compare is chronologically correct.
  const getRangeValidationMessage = (): string => {
    if (!value) return "";
    if (value < inputMin) return `Date must be on or after ${formatDate(parseISO(inputMin))}.`;
    if (value > inputMax) return `Date must be on or before ${formatDate(parseISO(inputMax))}.`;
    return "";
  };

  const validationMessage = getValidationMessage?.() || getRangeValidationMessage();

  return (
    <div className="flex flex-col gap-xs">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <input
        ref={inputRef}
        type="date"
        id={name}
        name={name}
        data-testid={name}
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage)}`}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        defaultValue={value ?? ""}
        onChange={handleChange}
        min={inputMin}
        max={inputMax}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
