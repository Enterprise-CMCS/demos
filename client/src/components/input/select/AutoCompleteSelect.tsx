import React, { useState, useRef, useEffect } from "react";
import { ChevronIcon } from "components/icons/ChevronIcon";

export interface Option {
  label: string;
  value: string;
}

export interface AutoCompleteSelectProps {
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  id?: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  defaultValue?: string;
}

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options,
  placeholder = "Select",
  onSelect,
  id,
  label,
  isRequired = false,
  isDisabled = false,
  defaultValue = "",
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [filtered, setFiltered] = useState<Option[]>(options);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter by label
  useEffect(() => {
    const low = inputValue.toLowerCase();
    setFiltered(
      options.filter((opt) => opt.label.toLowerCase().includes(low))
    );
    setActiveIndex(-1);
  }, [inputValue, options]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Keyboard navigation
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
    <div className="w-64" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block mb-1 font-semibold text-gray-800">
          {isRequired && <span className="text-red-500 mr-1">*</span>}
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => !isDisabled && setIsOpen(true)}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          required={isRequired}
          disabled={isDisabled}
          className={`
            w-full border border-gray-400 rounded-sm py-1 px-1 pr-10
            text-gray-700 bg-white disabled:bg-gray-100 disabled:text-gray-500
            placeholder-gray-400 focus:outline-none focus:border-blue-500
            focus:ring-1 focus:ring-blue-500 appearance-none
          `}
        />

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <ChevronIcon className="text-gray-500 w-2 h-1" />
        </div>

        {isOpen && (
          <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-sm mt-0.5 max-h-56 overflow-auto shadow-sm">
            {filtered.length > 0 ? (
              filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  className={`
                    px-1 py-1 text-sm text-gray-800 cursor-pointer
                    ${i === activeIndex ? "bg-blue-50" : ""}
                    hover:bg-blue-50
                  `}
                  onMouseDown={() => choose(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="px-2 py-1 text-sm text-gray-500">
                No matches found
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
