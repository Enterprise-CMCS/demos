import { Table } from "@tanstack/react-table";
import { ExitIcon } from "components/icons";
import React from "react";

export interface KeywordSearchProps<T extends object> {
  table: Table<T>;
  label?: string;
  className?: string;
}

// Helper function to highlight matching text
export function highlightText(text: string, query: string | string[]): React.ReactNode {
  if (!query || (Array.isArray(query) && query.length === 0)) {
    return text;
  }

  // Handle both string and array inputs
  const keywords = Array.isArray(query) ? query : [query];
  const validKeywords = keywords.filter(k => k.trim().length > 0);

  if (validKeywords.length === 0) {
    return text;
  }

  // Create regex pattern for all keywords
  const pattern = validKeywords.map(k => `(${k})`).join("|");
  const regex = new RegExp(pattern, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Create a fresh regex for each test, or use a different method
    const testRegex = new RegExp(pattern, "gi");
    if (testRegex.test(part)) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 font-semibold"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function KeywordSearch<T extends object>({
  table,
  label = "Search",
  className = "",
}: KeywordSearchProps<T>) {
  const [queryString, setQueryString] = React.useState<string>("");

  const onValueChange = (val: string) => {
    setQueryString(val);
    if (val) {
      const keywords = val.trim().split(/\s+/).filter(word => word.length > 0);
      table.setGlobalFilter(keywords);
    } else {
      table.setGlobalFilter("");
    }
  };

  const clearSearch = () => {
    setQueryString("");
    table.setGlobalFilter("");
  };

  return (
    <div className={className}>
      <label
        htmlFor="keyword-search"
        className="ml-2 font-semibold block mb-1"
      >
        {label}
      </label>

      <div className="ml-2 mb-2 mr-2 flex items-center gap-2 text-sm relative">
        <input
          id="keyword-search"
          className="border px-2 py-1 rounded"
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
