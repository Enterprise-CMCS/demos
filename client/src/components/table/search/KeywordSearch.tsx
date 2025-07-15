import { Table } from "@tanstack/react-table";
import { ExitIcon, SearchIcon } from "components/icons";
import React from "react";

export interface KeywordSearchProps<T> {
  table?: Table<T>; // Make table optional since it comes from parent
  label?: string;
  className?: string;
  debounceMs?: number;
  storageKey?: string;
}



export function KeywordSearch<T>({
  table,
  label = "Search:",
  className = "",
  debounceMs = 300,
  storageKey = "keyword-search",
}: KeywordSearchProps<T>) {
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Early return if table is not provided
  if (!table) {
    console.warn("KeywordSearch: table prop is required");
    return null;
  }

  // Initialize state with localStorage value
  const [queryString, setQueryString] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(storageKey) || "";
      } catch (error) {
        console.warn("Failed to read from localStorage:", error);
        return "";
      }
    }
    return "";
  });

  const debouncedSearch = React.useCallback((val: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (val) {
        const keywords = val.trim().split(/\s+/).filter(word => word.length > 0);
        table.setGlobalFilter(keywords);
      } else {
        table.setGlobalFilter("");
      }
    }, debounceMs);
  }, [table, debounceMs]);

  const onValueChange = (val: string) => {
    setQueryString(val);

    // Persist to localStorage
    if (typeof window !== "undefined") {
      try {
        if (val) {
          localStorage.setItem(storageKey, val);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn("Failed to write to localStorage:", error);
      }
    }

    debouncedSearch(val);
  };

  const clearSearch = () => {
    setQueryString("");

    // Remove from localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn("Failed to remove from localStorage:", error);
      }
    }

    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    table.setGlobalFilter("");
  };

  // Apply initial search on mount if there's a stored value
  React.useEffect(() => {
    if (queryString) {
      debouncedSearch(queryString);
    }
  }, [queryString, debouncedSearch]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <label
        htmlFor="keyword-search"
        className="ml-2 font-semibold block mb-1"
      >
        {label}
      </label>

      <div className="ml-2 mb-2 mr-2 flex items-center gap-2 text-sm relative">
        <SearchIcon className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <input
          id="keyword-search"
          className="border px-3 py-1 rounded"
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
