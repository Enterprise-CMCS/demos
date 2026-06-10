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
  isRequired = false,
  isDisabled = false,
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  getValidationMessage = () => "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const newDateInRange = newDate >= minDate && newDate <= maxDate;
    if (newDate === "" || newDateInRange) {
      console.log("Date is valid, calling onChange", newDate);
      onChange?.(newDate);
    }
  };

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
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
