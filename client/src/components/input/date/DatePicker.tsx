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
  // Displayed date is needed to show out of range values in the input while not propagating them to the parent component via onChange.
  const [displayedDate, setDisplayedDate] = React.useState(value ?? "");

  // This is needed to update the displayed date when the parent component controls the value (e.g. when resetting the form). Without this, the input would not update to reflect changes to the value prop after the initial render. We want to allow the parent to control the value while still letting the user type out-of-range values without immediately reverting them back to a valid date. This effect ensures that when the parent updates the value prop
  // (e.g. a computed date), the displayed date in the input also updates accordingly.
  React.useEffect(() => {
    setDisplayedDate(value ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDisplayedDate(newDate);

    // Only call onChange if the date is valid (empty or within range).
    if (newDate === "" || (newDate >= minDate && newDate <= maxDate)) {
      onChange?.(newDate);
    }
  };

  const getDateValidationMessage = (): string => {
    // First check if there's a custom validation message from the caller
    if (getValidationMessage) {
      const customMessage = getValidationMessage();
      if (customMessage) return customMessage;
    }

    // Nothing to validate if there's no value, return
    if (!displayedDate) return "";

    // Check for the date to be in range
    if (displayedDate < minDate)
      return `Date must be on or after ${formatDate(parseISO(minDate))}.`;
    if (displayedDate > maxDate)
      return `Date must be on or before ${formatDate(parseISO(maxDate))}.`;
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
        value={displayedDate}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
      />
      <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>
    </div>
  );
};
