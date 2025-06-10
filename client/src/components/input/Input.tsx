import React, { useState } from "react";

import { tw } from "tags/tw";

/**
 * TODO:
 *
 * 1. Determine if we need to support the "selected" state for inputs.
 * Leaving it out for now since it interacts oddly with the focus state.
 * Additionally, I'm not sure when a user would be selecting an input.
 * 2. The text seems lighter when it's not hovered - check this.
 * 3. Should the asterisk be a part of the label text? It changes the
 * label to *label and that could be confusing for screen readers.
 * 4. Look into certain aria-attibutes that could be useful for accessibility.
 */

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;

const INPUT_BASE_CLASSES = tw`border-1 rounded-minimal p-1 outline-none focus:ring-2
bg-surface-white hover:text-text-font
disabled:bg-surface-secondary disabled:border-border-fields disabled:text-text-placeholder`;

const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const getInputColors = (value: string, validationMessage: string) => {
  let classes = "";

  // Set Text Color
  if (value) {
    classes += tw`text-text-filled`;
  } else {
    classes += tw`text-text-placeholder`;
  }

  // Set Border Color
  if (validationMessage) {
    classes += tw`border-border-warn focus:border-border-warn  focus:ring-border-warn`;
  } else {
    classes += tw`border-border-fields focus:ring-action focus:border-action`;
  }

  return classes;
};

// Returns a string containing the error message if invalid, or an empty string if valid
export type InputValidationFunction = (value: string) => string;

export interface InputProps {
  name: string;
  label: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getValidationMessage?: (value: string) => string | undefined;
}

export const Input: React.FC<InputProps & { type: string }> = ({
  type,
  name,
  label,
  isRequired,
  isDisabled,
  placeholder,
  defaultValue,
  value: controlledValue,
  onChange,
  getValidationMessage,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    if (onChange) {
      onChange(event);
    }
  };

  // Compute validation message
  const validationMessage = getValidationMessage ? getValidationMessage(value ?? "") : "";

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={`${INPUT_BASE_CLASSES} ${getInputColors(value ?? "", validationMessage ?? "")}`}
        placeholder={placeholder ?? ""}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
      />
      {validationMessage && (
        <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>
      )}
    </div>
  );
};
