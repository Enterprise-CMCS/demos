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
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  getValidationMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);

  // The input is uncontrolled (defaultValue + ref-sync). Native <input type="date"> is fragile:
  // any DOM mutation, parent re-render, or write to .value while the field is focused can drop
  // focus, reset the mm→dd→yyyy subfield cursor, or close the native calendar. So while the user
  // is interacting with the field, React stays out — neither writing to the DOM here nor pushing
  // updates to the parent (see handleBlur). The DOM is only synced from the value prop on
  // external changes (load/reset) and only when the field is not focused.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || isFocusedRef.current) return;
    if (input.value !== (value ?? "")) {
      input.value = value ?? "";
    }
  }, [value]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  // Commit on blur (and only on blur). Propagating live on each keystroke makes the parent
  // re-render mid-edit, which in this app's dialog/form trees causes focus/calendar loss. Blur
  // commits the final value — empty (cleared), in-range, or out-of-range — so the displayed
  // value always matches what the parent holds and the out-of-range message surfaces correctly.
  const handleBlur = () => {
    isFocusedRef.current = false;
    onChange?.(inputRef.current?.value ?? "");
  };

  // Default out-of-range message, consistent with the native (inclusive) min/max bounds.
  // A caller-supplied getValidationMessage always takes precedence. Native <input type="date">
  // emits well-formed YYYY-MM-DD or "", so an ISO string compare is chronologically correct.
  const getRangeValidationMessage = (): string => {
    if (!value) return "";
    if (value < minDate) return `Date must be on or after ${formatDate(parseISO(minDate))}.`;
    if (value > maxDate) return `Date must be on or before ${formatDate(parseISO(maxDate))}.`;
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
        onFocus={handleFocus}
        onBlur={handleBlur}
        min={minDate}
        max={maxDate}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
