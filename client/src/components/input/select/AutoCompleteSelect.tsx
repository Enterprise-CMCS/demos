import React, { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "components/icons/Symbol/ChevronDownIcon";
import { tw } from "tags/tw";

import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "../Input";
import { Option } from "./Select";

export interface AutoCompleteSelectProps {
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  dataTestId?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;
const LIST_CLASSES = tw`absolute z-10 w-full bg-surface-white border border-border-fields rounded mt-0.5 max-h-56 overflow-auto shadow-sm`;
const ITEM_CLASSES = tw`px-1 py-1 text-sm text-text-font cursor-pointer hover:bg-surface-focus`;
const ITEM_ACTIVE_CLASSES = tw`bg-surface-focus`;
const EMPTY_CLASSES = tw`px-2 py-1 text-sm text-text-placeholder`;

const filterOptions = (options: Option[], searchTerm: string) => {
  searchTerm = searchTerm.toLowerCase();
  return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm));
};

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options,
  value,
  onSelect,
  id,
  dataTestId,
  placeholder = "Select",
  label,
  isRequired = false,
  isDisabled = false,
}) => {
  const [filterValue, setFilterValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(
    options.find((opt) => opt.value === value) || undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    setSelectedOption(selected);
  }, [value, options]);

  const containerRef = useRef<HTMLDivElement>(null);

  const closeSelect = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const openSelect = () => {
    setIsOpen(true);
  };

  const handleFilterChange = (filterValue: string) => {
    setFilterValue(filterValue);
    setActiveIndex(-1);
  };

  const handleSelectOption = (option: Option) => {
    onSelect(option.value);
    setSelectedOption(option);
    setFilterValue("");
    closeSelect();
  };

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSelect();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === "ArrowDown") {
      openSelect();
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, filterOptions(options, filterValue).length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      handleSelectOption(filterOptions(options, filterValue)[activeIndex]);
    } else if (e.key === "Escape") {
      closeSelect();
    }
  };

  return (
    <div className="flex flex-col gap-xs" ref={containerRef}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          data-testid={dataTestId || "input-autocomplete-select"}
          id={id}
          type="text"
          placeholder={placeholder}
          value={isOpen ? filterValue : selectedOption?.label || ""}
          onFocus={() => !isDisabled && setIsOpen(true)}
          onChange={(e) => handleFilterChange(e.target.value)}
          onKeyDown={onKeyDown}
          required={isRequired}
          disabled={isDisabled}
          className={`${INPUT_BASE_CLASSES} ${getInputColors("")} w-full`}
          data-form-type="other"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>

        {isOpen && (
          <ul className={LIST_CLASSES}>
            {filterOptions(options, filterValue).length > 0 ? (
              filterOptions(options, filterValue).map((option, i) => (
                <li
                  key={option.value}
                  className={`${ITEM_CLASSES} ${i === activeIndex ? ITEM_ACTIVE_CLASSES : ""}`}
                  onMouseDown={() => handleSelectOption(option)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className={EMPTY_CLASSES}>No matches found</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
