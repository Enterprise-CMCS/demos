import React, { useState } from "react";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const RADIO_CONTAINER_BASE_CLASSES = tw`flex gap-1`;
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
  title: string;
  options: RadioOption[];
  defaultValue?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInline?: boolean;
  getValidationMessage?: RadioValidationFunction;
}

export const RadioGroup = ({
  name,
  title,
  options,
  defaultValue = "",
  isRequired = false,
  isDisabled = false,
  isInline = false,
  getValidationMessage,
}: RadioGroupProps) => {
  const [value, setValue] = useState(defaultValue);
  const [validationMessage, setValidationMessage] = useState("");
  const [radioColorClasses, setRadioColorClasses] = useState(getRadioColors(""));
  const radioContainerClasses = isInline ? RADIO_CONTAINER_BASE_CLASSES :`${RADIO_CONTAINER_BASE_CLASSES} flex-col`;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const message = getValidationMessage ? getValidationMessage(newValue) : "";
    setValue(newValue);
    setValidationMessage(message);
    setRadioColorClasses(getRadioColors(message));
  };

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES}>
        {isRequired && <span className="text-text-warn">*</span>}
        {title}
      </label>
      <div className={radioContainerClasses}>
        {options.map((option) => (
          <label htmlFor={`${name}-radio-option-${option.value}`} key={option.value} className={RADIO_OPTION_CLASSES}>
            <input
              type="radio"
              id={`${name}-radio-option-${option.value}`}
              name={name}
              value={option.value}
              disabled={isDisabled}
              checked={value === option.value}
              onChange={handleChange}
              className={`${RADIO_INPUT_BASE_CLASSES} ${radioColorClasses}`}
              required={isRequired}
              aria-describedby={"helper-radio-text"}
            />
            <div>
              <p>{option.label}</p>
              {option.helperText && <p id="helper-radio-text" className="text-xs break-before font-normal text-gray-500 dark:text-gray-300">{option.helperText}</p>}
            </div>
          </label>
        ))}
      </div>
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
