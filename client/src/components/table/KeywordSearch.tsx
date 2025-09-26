import { CellContext, Row, Table } from "@tanstack/react-table";
import { ExitIcon, SearchIcon } from "components/icons";
import React from "react";

export interface KeywordSearchProps<T> {
  table: Table<T>;
  label?: string;
  debounceMs?: number;
  storageKey?: string;
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
}: KeywordSearchProps<T>) {
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [queryString, setQueryString] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";

    try {
      return localStorage.getItem(storageKey) || "";
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return "";
    }
  });

  const debouncedSearch = React.useCallback(
    (val: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        if (val) {
          const keywords = val
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0);
          table.setGlobalFilter(keywords);
        } else {
          table.setGlobalFilter("");
        }
      }, debounceMs);
    },
    [table, debounceMs]
  );

  const updateLocalStorage = (val: string) => {
    if (typeof window === "undefined") return;

    try {
      if (val) {
        localStorage.setItem(storageKey, val);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn("Failed to update localStorage:", error);
    }
  };

  const onValueChange = (val: string) => {
    setQueryString(val);
    updateLocalStorage(val);
    debouncedSearch(val);
  };

  const clearSearch = () => {
    setQueryString("");
    updateLocalStorage("");

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    table.setGlobalFilter("");
  };

  React.useEffect(() => {
    if (queryString) {
      debouncedSearch(queryString);
    }
  }, [queryString, debouncedSearch]);

  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <label htmlFor="keyword-search" className="ml-2 font-semibold block mb-1">
        {label}
      </label>

      <div className="ml-2 m-2 mr-2 flex items-center gap-2 text-sm relative">
        <SearchIcon className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <input
          id="keyword-search"
          className="border px-3 py-1 rounded pl-8 pr-8"
          value={queryString}
          onChange={(e) => onValueChange(e.target.value)}
          aria-label="Input keyword search query"
        />
        {queryString && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
            aria-label="Clear search"
          >
            <ExitIcon />
          </button>
        )}
      </div>
    </div>
  );
}
