import React from "react";

import { ChevronDownIcon } from "components/icons";
import { LABEL_CLASSES, INPUT_BASE_CLASSES, getInputColors } from "components/input/Input";
import { tw } from "tags/tw";

const SELECT_SPECIFIC_CLASSES = tw`w-full appearance-none`;
const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;

export interface Option {
  label: string;
  value: string;
}

export interface SelectProps {
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  id?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  value?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select",
  onSelect,
  id,
  label,
  isRequired = false,
  isDisabled = false,
  value,
}) => {
  return (
    <div className="flex flex-col gap-sm">
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative">
        <select
          data-testid={id}
          id={id}
          required={isRequired}
          disabled={isDisabled}
          value={value ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className={`${INPUT_BASE_CLASSES} ${SELECT_SPECIFIC_CLASSES} ${getInputColors("")}`}
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
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pr-1">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>
      </div>
    </div>
  );
};
