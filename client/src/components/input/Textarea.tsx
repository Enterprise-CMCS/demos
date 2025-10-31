import React, { useState } from "react";

import { tw } from "tags/tw";

import { getInputColors, LABEL_CLASSES } from "./Input";

const MAX_ROWS = 3;

const TEXTAREA_BASE_CLASSES = tw`border-1 rounded-minimal p-half outline-none focus:ring-2
bg-surface-white hover:text-text-font resize-none overflow-hidden
disabled:bg-surface-secondary disabled:border-border-fields disabled:text-text-placeholder`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

export interface TextareaProps {
  name: string;
  label: string;
  initialValue: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  getValidationMessage?: (value: string) => string | undefined;
}

export const Textarea: React.FC<TextareaProps> = ({
  name,
  label,
  initialValue,
  onChange,
  isRequired,
  isDisabled,
  placeholder,
  getValidationMessage,
}) => {
  const [value, setValue] = useState(initialValue);
  const validationMessage = getValidationMessage ? getValidationMessage(value) : "";
  const rowsToDisplay = Math.min(Math.max(value.split("\n").length, 1), MAX_ROWS);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };
  return (
    <div className="flex flex-col gap-xs">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        data-testid={`textarea-${name}`}
        className={`${TEXTAREA_BASE_CLASSES} ${getInputColors(validationMessage ?? "")}`}
        placeholder={placeholder ?? ""}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        value={value}
        onChange={handleChange}
        rows={rowsToDisplay}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
