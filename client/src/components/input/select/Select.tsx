import React, { useId, useRef, useState } from "react";

import { ChevronDownIcon } from "components/icons";
import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { tw } from "tags/tw";

import { SelectOption } from "./SelectOption";

const SELECT_SPECIFIC_CLASSES = tw`w-full text-left`;
const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;
const LIST_CLASSES = tw`absolute z-10 w-full bg-surface-white border border-border-fields rounded mt-0.5 max-h-56 overflow-auto shadow-sm`;

const OPEN_KEYS = ["ArrowDown", "ArrowUp", "Enter", " "];
const NAVIGATION_KEYS = ["ArrowDown", "ArrowUp", "Home", "End"];
const SELECT_KEYS = ["Enter", " "];

export interface Option {
  label: string;
  value: string;
}

const isTypeAheadKey = (e: React.KeyboardEvent) =>
  e.key.length === 1 && e.key !== " " && !e.altKey && !e.ctrlKey && !e.metaKey;

const findIndexByFirstChar = (options: Option[], char: string, startIndex: number) => {
  char = char.toLowerCase();
  for (let offset = 1; offset <= options.length; offset++) {
    const i = (startIndex + offset) % options.length;
    if (options[i].label.toLowerCase().startsWith(char)) {
      return i;
    }
  }
  return -1;
};

const getNextActiveIndex = (key: string, activeIndex: number, optionCount: number) => {
  switch (key) {
    case "ArrowDown":
      return Math.min(activeIndex + 1, optionCount - 1);
    case "ArrowUp":
      return Math.max(activeIndex - 1, 0);
    case "Home":
      return 0;
    case "End":
      return optionCount - 1;
    default:
      return activeIndex;
  }
};

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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const generatedId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectId = id || generatedId;
  const labelId = `${selectId}-label`;
  const listboxId = `${selectId}-listbox`;
  const validationMessageId = `${selectId}-validation-message`;
  const getOptionId = (index: number) => `${listboxId}-${index}`;

  const allOptions: Option[] = [{ label: placeholder, value: "" }, ...options];
  const selectedIndex = allOptions.findIndex((opt) => opt.value === (value ?? ""));
  const selectedOption = allOptions[Math.max(selectedIndex, 0)];

  const openSelect = (index = Math.max(selectedIndex, 0)) => {
    setIsOpen(true);
    setActiveIndex(index);
  };

  const closeSelect = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleSelectOption = (option: Option) => {
    onSelect(option.value);
    closeSelect();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      closeSelect();
    }
  };

  const handleTypeAhead = (char: string) => {
    const matchIndex = findIndexByFirstChar(allOptions, char, isOpen ? activeIndex : selectedIndex);
    if (matchIndex >= 0) {
      openSelect(matchIndex);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isTypeAheadKey(e)) {
      handleTypeAhead(e.key);
      return;
    }

    if (!isOpen) {
      if (OPEN_KEYS.includes(e.key)) {
        e.preventDefault();
        openSelect();
      }
      return;
    }

    if (NAVIGATION_KEYS.includes(e.key)) {
      e.preventDefault();
      setActiveIndex((i) => getNextActiveIndex(e.key, i, allOptions.length));
    } else if (SELECT_KEYS.includes(e.key) && activeIndex >= 0) {
      e.preventDefault();
      handleSelectOption(allOptions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSelect();
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label id={labelId} htmlFor={selectId} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative" ref={containerRef} onBlur={handleBlur}>
        <button
          type="button"
          data-testid={id}
          id={selectId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
          aria-required={isRequired}
          aria-invalid={!!validationMessage}
          aria-describedby={validationMessage ? validationMessageId : undefined}
          disabled={isDisabled}
          onClick={() => (isOpen ? closeSelect() : openSelect())}
          onKeyDown={onKeyDown}
          className={`${INPUT_BASE_CLASSES} ${SELECT_SPECIFIC_CLASSES} ${getInputColors(validationMessage)}`}
        >
          {selectedOption.label}
        </button>
        <div className="pointer-events-none absolute inset-y-0 inset-e-0 flex items-center pr-1">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            className={LIST_CLASSES}
          >
            {allOptions.map((opt, i) => (
              <SelectOption
                key={opt.value}
                id={getOptionId(i)}
                testId={opt.value ? `${id}-option-${opt.value}` : `${id}-option-empty`}
                label={opt.label}
                value={opt.value}
                isActive={i === activeIndex}
                isSelected={i === Math.max(selectedIndex, 0)}
                onSelect={() => handleSelectOption(opt)}
                onHover={() => setActiveIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
      {validationMessage && (
        <span id={validationMessageId} className="text-error-dark">
          {validationMessage}
        </span>
      )}
    </div>
  );
};
