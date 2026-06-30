import React, { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "components/icons/Symbol/ChevronDownIcon";
import { tw } from "tags/tw";

import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "../Input";
import { Option } from "./Select";

export const AUTOCOMPLETE_SELECT_TEST_ID = "input-autocomplete-select";

const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;
const LIST_CLASSES = tw`absolute z-10 w-full bg-surface-white border border-border-fields rounded mt-0.5 max-h-56 overflow-auto shadow-sm`;
const ITEM_CLASSES = tw`px-1 py-1 text-sm text-text-font cursor-pointer hover:bg-surface-focus`;
const ITEM_ACTIVE_CLASSES = tw`bg-surface-focus`;
const EMPTY_CLASSES = tw`px-2 py-1 text-sm text-text-placeholder`;

const filterOptions = (options: Option[], searchTerm: string) => {
  searchTerm = searchTerm.toLowerCase();
  return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm));
};

export const AutoCompleteSelect = ({
  options,
  value,
  onSelect,
  id,
  dataTestId,
  placeholder = "Select",
  label,
  isRequired = false,
  isDisabled = false,
  noMatchMessage,
  onFilterChange: onFilterChangeProp,
}: {
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  dataTestId?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  noMatchMessage?: string;
  onFilterChange?: (filterValue: string, hasMatches: boolean) => void;
}) => {
  const [filterValue, setFilterValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(
    options.find((opt) => opt.value === value) || undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const prevValueRef = useRef(value);

  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    setSelectedOption(selected);
    if (selected && value !== prevValueRef.current) {
      setFilterValue("");
      setIsOpen(false);
      setActiveIndex(-1);
    }
    prevValueRef.current = value;
  }, [value, options]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSelect = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      closeSelect();
    }
  };

  const openSelect = () => {
    setIsOpen(true);
  };

  const activateSelect = () => {
    if (!isDisabled) {
      openSelect();
    }
  };

  const handleFilterChange = (newFilterValue: string) => {
    activateSelect();
    setFilterValue(newFilterValue);
    setActiveIndex(-1);
    const matches = filterOptions(options, newFilterValue);
    onFilterChangeProp?.(newFilterValue, matches.length > 0);
  };

  const handleSelectOption = (option: Option) => {
    onSelect(option.value);
    setSelectedOption(option);
    setFilterValue("");
    onFilterChangeProp?.("", true);
    closeSelect();
    inputRef.current?.select();
  };

  const listboxId = `${id || dataTestId || "autocomplete"}-listbox`;

  const filteredOptions = filterOptions(options, filterValue);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === "ArrowDown") {
      openSelect();
      return;
    }
    if (!isOpen && e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleFilterChange(e.key);
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      handleSelectOption(filteredOptions[activeIndex]);
    } else if (e.key === "Escape") {
      closeSelect();
    }
  };

  const renderDropdownContent = () => {
    if (filteredOptions.length > 0) {
      return filteredOptions.map((option, i) => {
        const isActive = i === activeIndex;
        return (
          <li key={option.value} role="option" aria-selected={option.value === value}>
            <button
              type="button"
              className={`${ITEM_CLASSES} ${isActive ? ITEM_ACTIVE_CLASSES : ""} w-full text-left`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {option.label}
            </button>
          </li>
        );
      });
    }

    const message = noMatchMessage && filterValue.trim() ? noMatchMessage : "No matches found";
    return <li className={EMPTY_CLASSES}>{message}</li>;
  };

  return (
    <div className="flex flex-col gap-xs" ref={containerRef} onBlur={handleBlur}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          ref={inputRef}
          data-testid={dataTestId || "input-autocomplete-select"}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          placeholder={placeholder}
          value={isOpen ? filterValue : selectedOption?.label || ""}
          onFocus={activateSelect}
          onClick={activateSelect}
          onChange={(e) => handleFilterChange(e.target.value)}
          onKeyDown={onKeyDown}
          required={isRequired}
          disabled={isDisabled}
          className={`${INPUT_BASE_CLASSES} ${getInputColors("")} w-full`}
          data-form-type="other"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 inset-e-0 flex items-center pr-1">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>

        {isOpen && (
          <ul id={listboxId} role="listbox" className={LIST_CLASSES}>
            {renderDropdownContent()}
          </ul>
        )}
      </div>
    </div>
  );
};
