import React from "react";

import { ExitIcon, SearchIcon } from "components/icons";
import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { useDebounced } from "hooks/useDebounced";

import { CellContext, Row, Table } from "@tanstack/react-table";

export const TEST_IDS = {
  input: "input-keyword-search",
  clearButton: "button-clear-search",
};

export interface KeywordSearchProps<T> {
  table: Table<T>;
  label?: string;
  debounceMs?: number;
  storageKey?: string;
  placeholder?: string;
}

export const arrIncludesAllInsensitive = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: (string | undefined)[]
) => {
  const validFilterValues = filterValue.filter((val): val is string => val != null);

  if (validFilterValues.length === 0) {
    return true;
  }

  return !validFilterValues.some((val: string) => {
    const search = val.toLowerCase();
    const rowValue = row.getValue(columnId);

    return !(rowValue != null && rowValue.toString().toLowerCase().includes(search));
  });
};

export function highlightCell<TData>({
  cell,
  table,
}: CellContext<TData, unknown>): React.ReactNode {
  const raw = cell.getValue();
  const text = raw == null ? "" : String(raw);
  const query = table.getState().globalFilter || "";

  const keywords = Array.isArray(query) ? query : [query];
  const validKeywords = keywords.filter((k) => k?.trim().length > 0);

  if (!validKeywords.length) return text;

  const pattern = validKeywords.map((k) => `(${k})`).join("|");
  const regex = new RegExp(pattern, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 font-semibold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function KeywordSearch<T>({
  table,
  label = "Search:",
  debounceMs = 300,
  storageKey = "keyword-search",
  placeholder = "Search",
}: KeywordSearchProps<T>) {
  const [queryString, setQueryString] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";

    try {
      return localStorage.getItem(storageKey) || "";
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return "";
    }
  });

  const debouncedQueryString = useDebounced(queryString, debounceMs);

  React.useEffect(() => {
    if (debouncedQueryString) {
      const keywords = debouncedQueryString
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      table.setGlobalFilter(keywords);
    } else {
      table.setGlobalFilter("");
    }
  }, [debouncedQueryString, table]);

  const onValueChange = (val: string) => {
    setQueryString(val);
  };

  const clearSearch = () => {
    setQueryString("");
    table.setGlobalFilter("");
  };

  return (
    <div className="flex flex-col gap-sm">
      <label htmlFor="input-keyword-search" className={LABEL_CLASSES}>
        {label}
      </label>
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-1 text-gray-500 pointer-events-none" />
        <input
          type="text"
          id={TEST_IDS.input}
          name={TEST_IDS.input}
          data-testid={TEST_IDS.input}
          value={queryString}
          onChange={(e) => onValueChange(e.target.value)}
          className={`${INPUT_BASE_CLASSES} ${getInputColors("")} w-full pl-10 pr-10`}
          aria-label="Input keyword search query"
          placeholder={placeholder}
        />
        {queryString && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-1 text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Clear search"
            data-testid={TEST_IDS.clearButton}
          >
            <ExitIcon />
          </button>
        )}
      </div>
    </div>
  );
}
