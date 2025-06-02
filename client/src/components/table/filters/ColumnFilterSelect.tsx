// src/components/table/filters/ColumnFilterSelect.tsx
import React from "react";
import { Column, Table } from "@tanstack/react-table";

export interface ColumnFilterByDropdownProps<T extends object> {
  /** The table instance from useReactTable(...) */
  table: Table<T>;
  /** All columns you want to let the user filter by */
  columns: Column<T, unknown>[];
  /** Optional label text (defaults to "Filter by:") */
  label?: string;
  /** Optional tailwind classes to tweak width/margins */
  className?: string;
}

export function ColumnFilterByDropdown<T extends object>({
  table,
  columns,
  label = "Filter by:",
  className = "",
}: ColumnFilterByDropdownProps<T>) {
  // Local state: which columnKey is currently selected ("" = none)
  const [selectedColumn, setSelectedColumn] = React.useState<string>("");

  // Local state: the text the user types to filter that chosen column
  const [filterValue, setFilterValue] = React.useState<string>("");

  // Whenever selectedColumn changes, clear filterValue and clear any table filters:
  React.useEffect(() => {
    setFilterValue("");
    table.setColumnFilters([]);
  }, [selectedColumn]);

  // Handler for when the user types a value to filter
  const onValueChange = (val: string) => {
    setFilterValue(val);
    if (val && selectedColumn) {
      table.setColumnFilters([{ id: selectedColumn, value: val }]);
    } else {
      // If they cleared the text or column is "", clear all filters
      table.setColumnFilters([]);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="filter-by-column" className="ml-2 font-semibold block mb-1">
        {label}
      </label>
      <div className="ml-2 mb-4 flex items-center gap-2 text-sm">
        {/** Dropdown of column choices **/}
        <select
          id="filter-by-column"
          className="border px-2 py-1 rounded"
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
          <option value="">Select</option>
          {columns.map((col) => {
            const colKey: string = col.id;
            const displayLabel =
            typeof col.columnDef.header === "string"
              ? col.columnDef.header
              : col.id;
            return (
              <option key={colKey} value={colKey}>
                {displayLabel}
              </option>
            );
          })}
        </select>

        {selectedColumn && (
          <input
            type="text"
            placeholder="Type to filter…"
            className="border px-2 py-1 rounded flex-1"
            value={filterValue}
            onChange={(e) => onValueChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

export default ColumnFilterByDropdown;
