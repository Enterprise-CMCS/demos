import React, { useState } from "react";
import { tw } from "tags/tw";
import { LABEL_CLASSES } from "./Input";

const MAX_ROWS = 3;

const TEXTAREA_BASE_CLASSES = tw`border-1 rounded-minimal p-1 outline-none focus:ring-2
bg-surface-white hover:text-text-font resize-none overflow-hidden
disabled:bg-surface-secondary disabled:border-border-fields disabled:text-text-placeholder`;
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const getTextareaColors = (value: string, validationMessage: string) => {
  let classes = "";
  classes += tw`text-text-filled`;
  if (validationMessage) {
    classes += tw`border-border-warn focus:border-border-warn focus:ring-border-warn`;
  } else {
    classes += tw`border-border-fields focus:ring-action focus:border-action`;
  }
  return classes;
};

export interface TextareaProps {
  name: string;
  label: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  getValidationMessage?: (value: string) => string | undefined;
}

export const Textarea: React.FC<TextareaProps> = ({
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e);
  };

  // For now, count actual line breaks, ignore text wrapping
  // properly calculating when to wrap and show more rows is non-trivial
  const rowsToDisplay = Math.min(Math.max(currentValue.split("\n").length, 1), MAX_ROWS);

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES} htmlFor={name}>
        {isRequired && <span className="text-text-warn">*</span>}
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        data-testid={`textarea-${name}`}
        className={`${TEXTAREA_BASE_CLASSES} ${getTextareaColors(currentValue, validationMessage ?? "")}`}
        placeholder={placeholder ?? ""}
        required={isRequired ?? false}
        disabled={isDisabled ?? false}
        value={currentValue}
        onChange={handleChange}
        rows={rowsToDisplay}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
