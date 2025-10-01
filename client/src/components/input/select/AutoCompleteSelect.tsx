import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "components/icons/Symbol/ChevronDownIcon";
import { tw } from "tags/tw";
import { Option } from "./Select";

export interface AutoCompleteSelectProps {
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  id?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  defaultValue?: string;
  value?: string;
}

const LABEL_CLASSES = tw`text-text-font font-bold text-field-label flex gap-0-5`;
const INPUT_CLASSES = tw`w-full border border-border-fields rounded px-1 py-1
  text-text-font bg-surface-white disabled:bg-surface-disabled
  disabled:text-text-placeholder placeholder-text-placeholder focus:outline-none 
  focus:border-border-focus focus:ring-1 focus:ring-border-focus appearance-none text-sm`;
const ICON_CLASSES = tw`text-text-placeholder w-2 h-1`;
const LIST_CLASSES = tw`absolute z-10 w-full bg-surface-white border border-border-fields rounded mt-0.5 max-h-56 overflow-auto shadow-sm`;
const ITEM_CLASSES = tw`px-1 py-1 text-sm text-text-font cursor-pointer hover:bg-surface-focus`;
const ITEM_ACTIVE_CLASSES = tw`bg-surface-focus`;
const EMPTY_CLASSES = tw`px-2 py-1 text-sm text-text-placeholder`;

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options,
  placeholder = "Select",
  onSelect,
  id,
  label,
  isRequired = false,
  isDisabled = false,
  defaultValue = "",
  value,
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [filtered, setFiltered] = useState<Option[]>(options);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external controlled value
  useEffect(() => {
    if (value !== undefined) {
      const match = options.find((opt) => opt.value === value);
      setInputValue(match?.label || "");
    }
  }, [value, options]);

  // Filter by label
  useEffect(() => {
    const low = inputValue.toLowerCase();
    setFiltered(options.filter((opt) => opt.label.toLowerCase().includes(low)));
    setActiveIndex(-1);
  }, [inputValue, options]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === "ArrowDown") {
      setIsOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      const choice = filtered[activeIndex];
      setInputValue(choice.label);
      onSelect(choice.value);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const choose = (opt: Option) => {
    setInputValue(opt.label);
    onSelect(opt.value);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-sm" ref={containerRef}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASSES}>
          {isRequired && <span className="text-text-warn">*</span>}
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          data-testid="input-autocomplete-select"
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => !isDisabled && setIsOpen(true)}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          required={isRequired}
          disabled={isDisabled}
          className={INPUT_CLASSES}
          data-form-type="other"
        />
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center">
          <ChevronDownIcon className={ICON_CLASSES} />
        </div>

        {isOpen && (
          <ul className={LIST_CLASSES}>
            {filtered.length > 0 ? (
              filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  className={`${ITEM_CLASSES} ${i === activeIndex ? ITEM_ACTIVE_CLASSES : ""}`}
                  onMouseDown={() => choose(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {opt.label}
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
