import React, { useState } from "react";
import { tw } from "tags/tw";

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const CHECKBOX_CONTAINER_BASE_CLASSES = tw`flex gap-1`;
const CHECKBOX_OPTION_CLASSES = tw`flex items-center gap-0-5 cursor-pointer`;
const CHECKBOX_INPUT_BASE_CLASSES = tw`
  form-checkbox align-middle text-action 
  h-2 w-2
  focus:ring-2 focus:ring-action
  cursor-pointer`;

const getCheckboxColors = (validationMessage: string) => {
  if (validationMessage) {
    return tw`text-error-dark focus:ring-border-warn`;
  }
  return tw`text-text-font focus:ring-action`;
};

export type CheckboxValidationFunction = (value: string[]) => string;

export interface CheckboxOption {
  label: string;
  value: string;
  helperText?: string;
}

export interface CheckboxGroupProps {
  name: string;
  label: string;
  options: CheckboxOption[];
  defaultValues?: string[];
  isRequired?: boolean;
  isDisabled?: boolean;
  isInline?: boolean;
  getValidationMessage?: CheckboxValidationFunction;
}

export const CheckboxGroup = ({
  name,
  label,
  options,
  defaultValues = [],
  isRequired = false,
  isDisabled = false,
  isInline = false,
  getValidationMessage,
}: CheckboxGroupProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);
  const [validationMessage, setValidationMessage] = useState("");
  let checkboxColorClasses = getCheckboxColors("");

  const checkboxContainerClasses = isInline
    ? CHECKBOX_CONTAINER_BASE_CLASSES
    : `${CHECKBOX_CONTAINER_BASE_CLASSES} flex-col`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const changedValue = event.target.value;
    let updatedValues;

    if (selectedValues.includes(changedValue)) {
      updatedValues = selectedValues.filter((v) => v !== changedValue);
    } else {
      updatedValues = [...selectedValues, changedValue];
    }

    const message = getValidationMessage ? getValidationMessage(updatedValues) : "";
    setSelectedValues(updatedValues);
    setValidationMessage(message);
    checkboxColorClasses = getCheckboxColors(message);
  };

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <div className={checkboxContainerClasses}>
        {options.map((option) => (
          <label key={option.value} className={CHECKBOX_OPTION_CLASSES}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              disabled={isDisabled}
              checked={selectedValues.includes(option.value)}
              onChange={handleChange}
              className={`${CHECKBOX_INPUT_BASE_CLASSES} ${checkboxColorClasses}`}
              required={isRequired && selectedValues.length === 0}
              aria-describedby={"helper-checkbox-text"}
            />
            <div>
              <p>{option.label}</p>
              {option.helperText && (
                <p
                  id="helper-checkbox-text"
                  className="text-xs break-before font-normal text-gray-500 dark:text-gray-300"
                >
                  {option.helperText}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
