import React from "react";
import {
  getInputColors,
  INPUT_BASE_CLASSES,
  LABEL_CLASSES,
  VALIDATION_MESSAGE_CLASSES,
} from "components/input/Input";
import { isAfter, isBefore } from "date-fns";

const DEFAULT_MIN_DATE = "1900-01-01";
const DEFAULT_MAX_DATE = "2099-12-31";

interface DatePickerProps {
  name: string;
  label: string;
  onChange?: (newDate: string) => void;
  value?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  getValidationMessage?: () => string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  name,
  value,
  onChange,
  isRequired,
  isDisabled,
  getValidationMessage,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (isAfter(newDate, DEFAULT_MIN_DATE) && isBefore(newDate, DEFAULT_MAX_DATE)) {
      onChange?.(newDate);
    }
  };

  const validationMessage = getValidationMessage ? getValidationMessage() : "";

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
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage ?? "")}`}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        defaultValue={value}
        onChange={handleChange}
        min={DEFAULT_MIN_DATE}
        max={DEFAULT_MAX_DATE}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
