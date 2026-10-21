import React, { useState } from "react";
import { ExitIcon, SearchIcon } from "components/icons";
import { INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { useDebounced } from "hooks/useDebounced";
import { CellContext, Row, Table } from "@tanstack/react-table";
import { expandAbbreviation } from "./abbreviation";

export const KEYWORD_SEARCH_INPUT_NAME = "input-keyword-search";
export const KEYWORD_SEARCH_CLEAR_BUTTON_NAME = "button-clear-search";

const DEBOUNCE_MS = 300;

export const arrIncludesAllInsensitive = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: string[]
) => {
  if (filterValue.length === 0) {
    return true;
  }

  return !filterValue.some((search: string) => {
    const rowValue = row.getValue(columnId);

    if (rowValue == null) {
      return true;
    }

    const rowValueLower = rowValue.toString().toLowerCase();
    const expandedSearchTerms = expandAbbreviation(search);

    return !expandedSearchTerms.some((term) => rowValueLower.includes(term.toLowerCase()));
  });
};

const parseKeywords = (queryString: string): string[] => {
  return queryString
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
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

  // Expand each keyword to include abbreviations and their full names
  const expandedKeywords = validKeywords.flatMap((keyword) => expandAbbreviation(keyword));

  const pattern = `(${expandedKeywords.map((keyword) => RegExp.escape(keyword)).join("|")})`;
  const regex = new RegExp(pattern, "gi");

  // Splitting by a regex with capturing groups includes the matches at odd indices
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = index % 2 === 1;
    return isMatch ? (
      <mark key={index} className="bg-yellow-200 font-semibold">
        {part}
      </mark>
    ) : (
      part
    );
  });
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-1 text-gray-500 hover:text-gray-700 cursor-pointer"
      aria-label="Clear search"
      data-testid={KEYWORD_SEARCH_CLEAR_BUTTON_NAME}
    >
      <ExitIcon />
    </button>
  );
}

export function KeywordSearch<T>({ table }: { table: Table<T> }) {
  const [queryString, setQueryString] = useState("");

  const debouncedQueryString = useDebounced(queryString, DEBOUNCE_MS);

  React.useEffect(() => {
    if (debouncedQueryString) {
      const keywords = parseKeywords(debouncedQueryString);
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
    <div className="flex flex-col gap-xs">
      <label htmlFor={KEYWORD_SEARCH_INPUT_NAME} className={LABEL_CLASSES}>
        Search:
      </label>
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-1 text-gray-500 pointer-events-none" />
        <input
          type="text"
          id={KEYWORD_SEARCH_INPUT_NAME}
          name={KEYWORD_SEARCH_INPUT_NAME}
          data-testid={KEYWORD_SEARCH_INPUT_NAME}
          value={queryString}
          onChange={(e) => onValueChange(e.target.value)}
          className={`${INPUT_BASE_CLASSES} w-full pl-10 pr-10`}
          aria-label="Input keyword search query"
          placeholder="Search"
        />
        {queryString && <ClearButton onClick={clearSearch} />}
      </div>
    </div>
  );
}
