import React, { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "components/icons";
import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { tw } from "tags/tw";

const SELECT_SPECIFIC_CLASSES = tw`w-full text-left`;
const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;
const LIST_CLASSES = tw`absolute z-10 w-full bg-surface-white border border-border-fields rounded mt-0.5 max-h-56 overflow-auto shadow-sm`;
const ITEM_CLASSES = tw`px-1 py-1 text-sm text-text-font cursor-pointer`;
const ITEM_ACTIVE_CLASSES = tw`bg-surface-focus`;

export interface Option {
  label: string;
  value: string;
}

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

  const containerRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLLIElement>(null);

  const allOptions: Option[] = [{ label: placeholder, value: "" }, ...options];
  const selectedIndex = allOptions.findIndex((opt) => opt.value === (value ?? ""));
  const selectedOption = allOptions[Math.max(selectedIndex, 0)];
  const listboxId = `${id || "select"}-listbox`;

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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

  const isTypeAheadKey = (e: React.KeyboardEvent) =>
    e.key.length === 1 && e.key !== " " && !e.altKey && !e.ctrlKey && !e.metaKey;

  const handleTypeAhead = (char: string) => {
    const matchIndex = findIndexByFirstChar(allOptions, char, isOpen ? activeIndex : selectedIndex);
    if (matchIndex >= 0) {
      openSelect(matchIndex);
    }
  };

  const handleOpenKeyDown = (key: string) => {
    switch (key) {
      case "ArrowDown":
        setActiveIndex((i) => Math.min(i + 1, allOptions.length - 1));
        return true;
      case "ArrowUp":
        setActiveIndex((i) => Math.max(i - 1, 0));
        return true;
      case "Home":
        setActiveIndex(0);
        return true;
      case "End":
        setActiveIndex(allOptions.length - 1);
        return true;
      case "Enter":
      case " ":
        if (activeIndex >= 0) {
          handleSelectOption(allOptions[activeIndex]);
        }
        return true;
      case "Escape":
        closeSelect();
        return true;
      default:
        return false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isTypeAheadKey(e)) {
      handleTypeAhead(e.key);
    } else if (isOpen) {
      if (handleOpenKeyDown(e.key)) {
        e.preventDefault();
      }
    } else if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openSelect();
    }
  };

  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}
      <div className="relative" ref={containerRef} onBlur={handleBlur}>
        <button
          type="button"
          data-testid={id}
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-required={isRequired}
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
          <ul id={listboxId} role="listbox" className={LIST_CLASSES}>
            {allOptions.map((opt, i) => {
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  ref={isActive ? activeOptionRef : undefined}
                  role="option"
                  aria-selected={opt.value === (value ?? "")}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    data-testid={opt.value ? `${id}-option-${opt.value}` : `${id}-option-empty`}
                    className={`${ITEM_CLASSES} ${isActive ? ITEM_ACTIVE_CLASSES : ""} w-full text-left`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {validationMessage && <span className="text-error-dark">{validationMessage}</span>}
    </div>
  );
};
