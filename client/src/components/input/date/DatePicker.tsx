import React from "react";
import {
  getInputColors,
  INPUT_BASE_CLASSES,
  LABEL_CLASSES,
  VALIDATION_MESSAGE_CLASSES,
} from "components/input/Input";

const DEFAULT_MIN_DATE = "1900-01-01";
const DEFAULT_MAX_DATE = "2099-12-31";
const FULL_YEAR_DATE = "1000-01-01";

export const DatePicker = ({
  label,
  name,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  validationMessage,
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
  validationMessage?: string;
}) => {
  const [touched, setTouched] = React.useState(false);

  // Displayed date is needed to keep partially typed year values visible before committing them.
  const [displayedDate, setDisplayedDate] = React.useState(value ?? "");

  // This is needed to update the displayed date when the parent component controls the value (e.g. when resetting the form). Without this, the input would not update to reflect changes to the value prop after the initial render. We want to allow the parent to control the value while still letting the user type out-of-range values without immediately reverting them back to a valid date. This effect ensures that when the parent updates the value prop
  // (e.g. a computed date), the displayed date in the input also updates accordingly.
  React.useEffect(() => {
    setDisplayedDate(value ?? "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDisplayedDate(newDate);

    // Browser date inputs can emit partial-year values while editing the year subfield.
    // Complete dates should propagate even when out of range so callers can validate current state.
    if (newDate === "" || newDate >= FULL_YEAR_DATE) {
      onChange?.(newDate);
    }
  };

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
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage || "")}`}
        required={isRequired}
        disabled={isDisabled}
        value={displayedDate}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        onBlur={() => setTouched(true)}
      />
      <span className={VALIDATION_MESSAGE_CLASSES}>{touched && validationMessage}</span>
    </div>
  );
};
