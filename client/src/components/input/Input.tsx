import React, { useState } from "react";

import { tw } from "tags/tw";

export const LABEL_CLASSES = tw`text-text-font font-semibold text-field-label flex gap-0-5`;
export const INPUT_BASE_CLASSES = tw`border-1 rounded-minimal p-[12px] outline-none focus:ring-2
bg-surface-white hover:text-text-font
disabled:bg-surface-secondary disabled:border-border-fields disabled:text-text-placeholder`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

export const getInputColors = (validationMessage: string) => {
  let classes = "";
  classes += tw`text-text-filled`;
  if (validationMessage) {
    classes += tw`border-border-warn focus:border-border-warn focus:ring-border-warn`;
  } else {
    classes += tw`border-border-fields focus:ring-action focus:border-action`;
  }
  return classes;
};

export type InputValidationFunction = (value: string) => string;

export interface InputProps {
  name: string;
  label: string;
  type: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getValidationMessage?: (value: string) => string | undefined;
}

export const Input: React.FC<InputProps> = ({
  type,
  name,
  label,
  isRequired,
  isDisabled,
  placeholder,
  value,
  onChange,
  defaultValue,
  getValidationMessage,
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const currentValue = isControlled ? value : internalValue;

  const validationMessage = getValidationMessage ? getValidationMessage(currentValue) : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="flex flex-col gap-xs">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <input
        id={name}
        name={name}
        data-testid={name}
        type={type}
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage ?? "")}`}
        placeholder={placeholder ?? ""}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        value={currentValue}
        onChange={handleChange}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
