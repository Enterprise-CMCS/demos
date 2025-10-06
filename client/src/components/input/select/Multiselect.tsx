import { ChevronDownIcon } from "components/icons";
import React from "react";
import { tw } from "tags/tw";
import ReactSelect from "react-select";

const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;

export interface Option<T = string> {
  label: string;
  value: T;
}

export interface SelectProps<T = string> {
  options: Option<T>[];
  onChange: (value: T[]) => void;
  value?: T[];
  id?: string;
  isSearchable?: boolean;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export const Multiselect = <T extends string = string>({
  options,
  value,
  onChange,
  id,
  isSearchable = true,
  label,
  placeholder = "Select",
  isRequired = false,
  isDisabled = false,
}: SelectProps<T>) => {
  // Convert value to Option format for ReactSelect
  const selectedOptions = value ? options.filter((option) => value.includes(option.value)) : [];

  // Handle ReactSelect onChange and convert back to value type
  const handleChange = (selectedOptions: readonly Option<T>[]) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    onChange(values);
  };

  return (
    <div className="flex flex-col gap-sm">
      {label && (
        <label htmlFor={id} className="text-text-font font-bold text-field-label flex gap-0-5">
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative w-full">
        <ReactSelect
          isMulti
          isSearchable={isSearchable}
          options={options}
          placeholder={placeholder}
          value={selectedOptions}
          onChange={handleChange}
          isDisabled={isDisabled}
          inputId={id}
          components={{
            DropdownIndicator: () => <ChevronDownIcon className={ICON_CLASSES} />,
          }}
        />
      </div>
    </div>
  );
};
