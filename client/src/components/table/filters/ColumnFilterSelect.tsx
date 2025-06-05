import React from "react";
import { Column, Table } from "@tanstack/react-table";

export interface ColumnFilterByDropdownProps<T extends object> {
  table: Table<T>;
  columns: Column<T, unknown>[];
  label?: string;
  className?: string;
}

export function ColumnFilterByDropdown<T extends object>({
  table,
  columns,
  label = "Filter by:",
  className = "",
}: ColumnFilterByDropdownProps<T>) {
  const [selectedColumn, setSelectedColumn] = React.useState<string>("");
  const [filterValue, setFilterValue] = React.useState<string>("");

  React.useEffect(() => {
    setFilterValue("");
    table.setColumnFilters([]);
  }, [selectedColumn]);

  const onValueChange = (val: string) => {
    setFilterValue(val);
    if (val && selectedColumn) {
      table.setColumnFilters([{ id: selectedColumn, value: val }]);
    } else {
      table.setColumnFilters([]);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="filter-by-column" className="ml-2 font-semibold block mb-1">
        {label}
      </label>
      <div className="ml-2 mb-2 mr-2 flex items-center gap-2 text-sm">
        <select
          id="filter-by-column"
          className="border px-2 py-1 rounded"
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
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

