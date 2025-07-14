import React from "react";
import { Column, Table } from "@tanstack/react-table";

export interface ColumnFilterByDropdownProps<T extends object> {
  table?: Table<T>; // Make table optional since it comes from parent
  columns?: Column<T, unknown>[]; // Make columns optional since it comes from parent
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

  // Early return if table or columns are not provided
  if (!table) {
    console.warn("ColumnFilterByDropdown: table prop is required");
    return null;
  }

  // Get columns from table if not provided as prop
  const availableColumns = columns || table.getAllColumns().filter(column => column.getCanFilter());

  // Whenever the selected column changes, reset the filterValue and clear filters
  React.useEffect(() => {
    setFilterValue("");
    table.setColumnFilters([]);
  }, [selectedColumn, table]);

  // Update the filter: if `val` is nonempty and there's a column selected, apply that filter
  const onValueChange = (val: string) => {
    setFilterValue(val);
    if (val && selectedColumn) {
      table.setColumnFilters([{ id: selectedColumn, value: val }]);
    } else {
      table.setColumnFilters([]);
    }
  };

  // Compute a small live‐region message to announce the number of filtered rows
  // (optional, but helpful for screen readers).
  const totalRows = table.getFilteredRowModel().rows.length;
  const liveMessage = `Showing ${totalRows} rows`;

  return (
    <div className={className}>
      <label
        htmlFor="filter-by-column"
        className="ml-2 font-semibold block mb-1"
      >
        {label}
      </label>

      <div className="ml-2 mb-2 mr-2 flex items-center gap-2 text-sm">
        <select
          id="filter-by-column"
          className="border px-2 py-1 rounded"
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          aria-label="Choose column to filter"
        >
          {/* Select a col better for screen */}
          <option value="" disabled>
            Select a Column...
          </option>

          {availableColumns.map((col) => {
            // Derive a display label:
            // If header is a string, use it; otherwise fall back to the column id.
            const displayLabel =
              typeof col.columnDef.header === "string"
                ? col.columnDef.header
                : col.id;

            return (
              <option key={col.id} value={col.id}>
                {displayLabel}
              </option>
            );
          })}
        </select>
        {selectedColumn && (
          <>
            <input
              type="text"
              // Announce to screen reader "Filter <Column Name> by …"
              aria-label={`Filter ${
                availableColumns.find((c) => c.id === selectedColumn)?.columnDef
                  .header || selectedColumn
              }`}
              placeholder="🔍 Type to filter…"
              className="border px-2 py-1 rounded"
              value={filterValue}
              onChange={(e) => onValueChange(e.target.value)}
            />
          </>
        )}
      </div>
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}
