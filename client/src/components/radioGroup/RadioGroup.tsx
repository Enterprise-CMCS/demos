import React, { useState } from "react";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const RADIO_CONTAINER_BASE_CLASSES = tw`flex`;
const RADIO_OPTION_CLASSES = tw`flex items-center gap-0-5 cursor-pointer`;
const RADIO_INPUT_BASE_CLASSES = tw`
  form-radio align-middle text-action 
  h-2 w-2
  cursor-pointer`;

const getRadioColors = (validationMessage: string) => {
  if (validationMessage) {
    return tw`text-error-dark focus:ring-border-warn`;
  }
  return tw`text-text-font focus:ring-action`;
};

export type RadioValidationFunction = (value: string) => string;

export interface RadioOption {
  label: string;
  value: string;
  helperText?: string;
}

export interface RadioGroupProps {
  name: string;
  title?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInline?: boolean;
  getValidationMessage?: RadioValidationFunction;
}

export const RadioGroup = ({
  name,
  title,
  options,
  value,
  onChange,
  isRequired = false,
  isDisabled = false,
  isInline = false,
  getValidationMessage,
}: RadioGroupProps) => {
  const [validationMessage, setValidationMessage] = useState("");
  const radioContainerClasses = isInline
    ? `${RADIO_CONTAINER_BASE_CLASSES} gap-2`
    : `${RADIO_CONTAINER_BASE_CLASSES} flex-col gap-1`;
  let radioColorClasses = getRadioColors("");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (value === newValue) return;
    const message = getValidationMessage ? getValidationMessage(newValue) : "";
    setValidationMessage(message);
    radioColorClasses = getRadioColors(message);
    onChange(newValue);
  };

  return (
    <fieldset className="flex flex-col border-0 p-0 m-0">
      {title && (
        <legend className={LABEL_CLASSES}>
          {isRequired && (
            <span className="text-text-warn" aria-label="required">
              *
            </span>
          )}
          {title}
        </legend>
      )}
      <div className={radioContainerClasses} role="radiogroup">
        {options.map((option) => {
          const optionId = option.value.replace(/\s+/g, "-").toLowerCase();
          const buttonId = `${name}-radio-option-${optionId}`;
          const helperId = validationMessage ? `${name}-validation-message` : `${buttonId}-helper`;
          const checked = value === option.value;
          return (
            <label htmlFor={buttonId} key={option.value} className={RADIO_OPTION_CLASSES}>
              <input
                type="radio"
                id={buttonId}
                data-testid={buttonId}
                name={name}
                value={option.value}
                disabled={isDisabled}
                checked={checked}
                onChange={handleChange}
                className={`${RADIO_INPUT_BASE_CLASSES} ${radioColorClasses}`}
                required={isRequired}
                aria-describedby={helperId}
                aria-invalid={!!validationMessage}
              />
              <div>
                <span>{option.label}</span>
                {option.helperText && (
                  <p
                    id={helperId}
                    className="text-xs break-before font-normal text-gray-500 dark:text-gray-300"
                  >
                    {option.helperText}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {validationMessage && (
        <span
          role="alert"
          aria-live="polite"
          id={`${name}-validation-message`}
          className={VALIDATION_MESSAGE_CLASSES}
        >
          {validationMessage}
        </span>
      )}
    </fieldset>
  );
};
