import React, { useEffect, useRef } from "react";
import {
  getInputColors,
  INPUT_BASE_CLASSES,
  LABEL_CLASSES,
  VALIDATION_MESSAGE_CLASSES,
} from "components/input/Input";
import { isAfter, isBefore, parseISO } from "date-fns";
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
  getValidationMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputMin = minDate && isAfter(minDate, DEFAULT_MIN_DATE) ? minDate : DEFAULT_MIN_DATE;

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (
      newDate === "" ||
      (isAfter(newDate, DEFAULT_MIN_DATE) && isBefore(newDate, DEFAULT_MAX_DATE))
    ) {
      onChange?.(newDate);
    }
  };

  const externalValidationMessage = getValidationMessage ? getValidationMessage() : "";
  const minViolationMessage =
    value && minDate && isBefore(value, minDate)
      ? `Date must be on or after ${formatDate(parseISO(minDate))}.`
      : "";
  const validationMessage = externalValidationMessage || minViolationMessage;

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
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage ?? "")}`}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        defaultValue={value ?? ""}
        onChange={handleChange}
        min={inputMin}
        max={DEFAULT_MAX_DATE}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
