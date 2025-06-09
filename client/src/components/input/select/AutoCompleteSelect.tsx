import React, { useState, useRef, useEffect } from "react";

export interface AutoCompleteSelectProps {
  options: string[];
  placeholder?: string;
  onSelect: (value: string) => void;
  // Optional HTML label ID for accessibility
  htmlLabelId?: string;
}

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options,
  placeholder = "Select...",
  onSelect,
  htmlLabelId = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue) {
      const lower = inputValue.toLowerCase();
      setFiltered(options.filter(o => o.toLowerCase().includes(lower)));
    } else {
      setFiltered(options);
    }
    setActiveIndex(-1);
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === "ArrowDown") {
      setIsOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      const val = filtered[activeIndex];
      setInputValue(val);
      onSelect(val);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (val: string) => {
    setInputValue(val);
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <div className="relative w-64" ref={containerRef}>
      <input
        id={htmlLabelId}
        type="text"
        className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring"
        placeholder={placeholder}
        value={inputValue}
        onFocus={() => setIsOpen(true)}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map((opt, idx) => (
              <li
                key={opt}
                className={`p-2 cursor-pointer hover:bg-blue-100 ${idx === activeIndex ? "bg-blue-100" : ""}`}
                onMouseDown={() => handleSelect(opt)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">No matches found</li>
          )}
        </ul>
      )}
    </div>
  );
};
