import React, { useId } from "react";

import { ChevronDownIcon } from "components/icons";
import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { tw } from "tags/tw";

// customizable-select (index.css) overrides appearance-none where base-select is supported.
const SELECT_SPECIFIC_CLASSES = tw`customizable-select w-full appearance-none`;
const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;

export interface Option {
  label: string;
  value: string;
}

export const Select = ({
  options,
  placeholder = "Select",
  onSelect,
  id,
  label,
  isRequired = false,
  isDisabled = false,
  value,
  validationMessage = "",
}: {
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  id?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  value?: string;
  validationMessage?: string;
}) => {
  const generatedId = useId();

  const selectId = id || generatedId;
  const validationMessageId = `${selectId}-validation-message`;

  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={selectId} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative">
        <select
          data-testid={id}
          id={selectId}
          required={isRequired}
          disabled={isDisabled}
          value={value ?? ""}
          aria-invalid={!!validationMessage}
          aria-describedby={validationMessage ? validationMessageId : undefined}
          onChange={(e) => onSelect(e.target.value)}
          className={`${INPUT_BASE_CLASSES} ${SELECT_SPECIFIC_CLASSES} ${getInputColors(validationMessage)}`}
        >
          <option data-testid={`${id}-option-empty`} value="">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} data-testid={`${id}-option-${opt.value}`}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 inset-e-0 flex items-center pr-1">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>
      </div>
      {validationMessage && (
        <span id={validationMessageId} className="text-error-dark">
          {validationMessage}
        </span>
      )}
    </div>
  );
};
