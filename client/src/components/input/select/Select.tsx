import { ChevronDownIcon } from "components/icons";
import React from "react";
import { tw } from "tags/tw";
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
        <label
          htmlFor={id}
          className="text-text-font font-bold text-field-label flex gap-0-5"
        >
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={id}
          required={isRequired}
          disabled={isDisabled}
          value={value ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full border border-border-fields rounded px-1 py-1 text-text-font bg-surface-white disabled:bg-surface-disabled disabled:text-text-placeholder placeholder-text-placeholder focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus appearance-none text-sm"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>{" "}
      </div>
    </div>
  );
};
