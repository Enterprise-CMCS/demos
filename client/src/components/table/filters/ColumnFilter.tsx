import React from "react";
import { Table } from "@tanstack/react-table";
import { AutoCompleteSelect, Option } from "components/input/select/AutoCompleteSelect";

export interface ColumnFilterByDropdownProps<T> {
  table: Table<T>;
  label?: string;
  className?: string;
}
export interface ColumnMetaFilterConfig {
  filterConfig?:
    | {
        filterType: "select";
        options: Option[]; // Required for select
      }
    | {
        filterType: "text";
        options?: never; // Explicitly exclude options for text
      }
    | {
        filterType: "date";
        options?: never; // Explicitly exclude options for date
      };
}

export function ColumnFilter<T>({
  table,
  label = "Filter by:",
  className = "",
}: ColumnFilterByDropdownProps<T>) {
  const [selectedColumn, setSelectedColumn] = React.useState<string>("");
  const [filterValue, setFilterValue] = React.useState<string>("");

  const availableColumns = table.getAllColumns().filter(column => column.getCanFilter());

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

  // Get the selected column's filter configuration
  const selectedColumnObj = availableColumns.find(col => col.id === selectedColumn);
  const meta: ColumnMetaFilterConfig | undefined = selectedColumnObj?.columnDef.meta;
  const filterConfig = meta?.filterConfig;

  // Render the appropriate input based on filter configuration
  const renderFilterInput = () => {
    if (!selectedColumn) return null;

    const filterType = filterConfig?.filterType || "text";
    const columnDisplayName = typeof selectedColumnObj?.columnDef.header === "string"
      ? selectedColumnObj.columnDef.header
      : selectedColumn;

    switch (filterType) {
      case "select":
        return (
          <AutoCompleteSelect
            options={filterConfig?.options || []}
            placeholder={`Filter ${columnDisplayName}`}
            value={filterValue}
            onSelect={(val) => onValueChange(val)}
            id={`filter-${selectedColumn}`}
          />
        );

      case "date":
        return (
          <input
            type="date"
            aria-label={`Filter ${columnDisplayName} by date`}
            className="border px-2 py-1 rounded"
            value={filterValue}
            onChange={(e) => onValueChange(e.target.value)}
          />
        );

      case "text":
      default:
        return (
          <input
            type="text"
            aria-label={`Filter ${columnDisplayName}`}
            placeholder="🔍 Type to filter…"
            className="border px-2 py-1 rounded"
            value={filterValue}
            onChange={(e) => onValueChange(e.target.value)}
          />
        );
    }
  };

  // Compute a small live‐region message to announce the number of filtered rows
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
          <option value="" disabled>
            Select a Column...
          </option>

          {availableColumns.map((col) => {
            const columnDef = col.columnDef;
            const displayLabel =
              typeof columnDef.header === "string"
                ? columnDef.header
                : col.id;

            return (
              <option key={col.id} value={col.id}>
                {displayLabel}
              </option>
            );
          })}
        </select>

        {renderFilterInput()}
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}
