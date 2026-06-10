import React from "react";
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

const DateValidationMessage = ({
  value,
  minDate,
  maxDate,
  customGetValidationMessage,
}: {
  value?: string;
  minDate: string;
  maxDate: string;
  customGetValidationMessage?: () => string;
}) => {
  if (customGetValidationMessage) {
    const customMessage = customGetValidationMessage();
    if (customMessage) return <span className={VALIDATION_MESSAGE_CLASSES}>{customMessage}</span>;
  }

  if (!value) return null;

  if (value < minDate)
    return (
      <span className={VALIDATION_MESSAGE_CLASSES}>
        Date must be on or after {formatDate(parseISO(minDate))}.
      </span>
    );
  if (value > maxDate)
    return (
      <span className={VALIDATION_MESSAGE_CLASSES}>
        Date must be on or before {formatDate(parseISO(maxDate))}.
      </span>
    );

  return null;
};

export const DatePicker = ({
  label,
  name,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  getValidationMessage = () => "",
}: {
  name: string;
  label: string;
  onChange?: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  minDate?: string;
  maxDate?: string;
  getValidationMessage?: () => string;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const newDateInRange = newDate >= minDate && newDate <= maxDate;
    if (newDate === "" || newDateInRange) {
      console.log("Date is valid, calling onChange", newDate);
      onChange?.(newDate);
    }
  };

  const getDateValidationMessage = (): string => {
    // First check if there's a custom validation message from the caller
    if (getValidationMessage) {
      const customMessage = getValidationMessage();
      if (customMessage) return customMessage;
    }

    // Second check if there's a date to validate
    if (!value) return "";

    // Second check for the date to be in range
    if (value < minDate) return `Date must be on or after ${formatDate(parseISO(minDate))}.`;
    if (value > maxDate) return `Date must be on or before ${formatDate(parseISO(maxDate))}.`;
    return "";
  };

  const validationMessage = getDateValidationMessage();

  return (
    <div className="flex flex-col gap-xs">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <input
        type="date"
        id={name}
        name={name}
        data-testid={name}
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage)}`}
        required={isRequired}
        disabled={isDisabled}
        value={value}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
      />
      <DateValidationMessage
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        customGetValidationMessage={getValidationMessage}
      />
    </div>
  );
};
