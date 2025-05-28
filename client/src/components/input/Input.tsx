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
const VALIDATION_MESSAGE_CLASSES = tw`text-error-dark`;

const INPUT_BASE_CLASSES = tw`border-1 rounded-minimal p-1 outline-none focus:ring-2
bg-surface-white hover:text-text-font
disabled:bg-surface-secondary disabled:border-border-fields disabled:text-text-placeholder`;

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
    type: string;
    name: string;
    label: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
    defaultValue?: string;
    getValidationMessage?: InputValidationFunction;
}

export const Input = (props: InputProps) => {
  const [value, setValue] = useState(props.defaultValue ?? "");
  const [validationMessage, setValidationMessage] = useState("");
  const [inputColorClasses, setInputColorClasses] = useState(getInputColors(value, validationMessage));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const newValidationMessage = getValidationMessage(event);
    setValue(newValue);
    setValidationMessage(newValidationMessage);
    setInputColorClasses(getInputColors(newValue, newValidationMessage));
  };

  const getValidationMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const validationMessage = props.getValidationMessage ?
      props.getValidationMessage(event.target.value) :
      event.target.validationMessage ?? "";

    return validationMessage;
  };

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES} htmlFor={props.name}>
        {props.isRequired && <span className="text-text-warn">*</span>}
        {props.label}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type}
        className={`${INPUT_BASE_CLASSES} ${inputColorClasses}`}
        placeholder={props.placeholder ?? ""}
        required={props.isRequired ?? false}
        disabled={props.isDisabled ?? false}
        value={value}
        onChange={handleChange}
      />
      {validationMessage && <span className={VALIDATION_MESSAGE_CLASSES}>{validationMessage}</span>}
    </div>
  );
};
