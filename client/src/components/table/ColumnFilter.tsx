import React from "react";
import { Table } from "@tanstack/react-table";
import { TextInput } from "components/input";
import { Dayjs } from "dayjs";
import { DatePicker } from "components/input/DatePicker/DatePicker";
import { AutoCompleteMultiselect } from "components/input/select/AutoCompleteMultiselect";
import { Option, Select } from "components/input/select/Select";

export interface ColumnFilterByDropdownProps<T> {
  table: Table<T>;
  label?: string;
  className?: string;
}

export interface ColumnMetaFilterConfig {
  filterConfig?:
    | {
        filterType: "select";
        options: Option[];
      }
    | {
        filterType: "text";
        options?: never;
      }
    | {
        filterType: "date";
        options?: never;
      };
}

export function ColumnFilter<T>({
  table,
  className = "",
}: ColumnFilterByDropdownProps<T>) {
  const [selectedColumn, setSelectedColumn] = React.useState<string>("");
  const [filterValue, setFilterValue] = React.useState<
    string | string[] | null
  >("");

  const [filterRangeValue, setFilterRangeValue] = React.useState<{
    start: Dayjs | null;
    end: Dayjs | null;
  }>({ start: null, end: null });

  const availableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter());

  const columnOptions: Option[] = availableColumns.map((col) => {
    const columnDef = col.columnDef;
    const displayLabel =
      typeof columnDef.header === "string" ? columnDef.header : col.id;

    return {
      label: displayLabel,
      value: col.id,
    };
  });

  // Whenever the selected column changes, reset the filterValue and clear filters
  React.useEffect(() => {
    setFilterValue("");
    table.setColumnFilters([]);
  }, [selectedColumn, table]);

  // Update the filter: if `val` is nonempty and there's a column selected, apply that filter
  const onValueChange = (val: string | string[] | null) => {
    setFilterValue(val);
    if (val && selectedColumn) {
      table.setColumnFilters([{ id: selectedColumn, value: val }]);
    } else {
      table.setColumnFilters([]);
    }
  };

  const onRangeChange = (start: Dayjs | null, end: Dayjs | null) => {
    setFilterRangeValue({ start, end });
    if (selectedColumn && (start || end)) {
      table.setColumnFilters([{ id: selectedColumn, value: { start, end } }]);
    } else {
      table.setColumnFilters([]);
    }
  };
  // Get the selected column's filter configuration
  const selectedColumnObj = availableColumns.find(
    (col) => col.id === selectedColumn
  );
  const meta: ColumnMetaFilterConfig | undefined =
    selectedColumnObj?.columnDef.meta;
  const filterConfig = meta?.filterConfig;

  // Render the appropriate input based on filter configuration
  const renderFilterInput = () => {
    if (!selectedColumn) return null;

    const filterType = filterConfig?.filterType || "text";
    const columnDisplayName =
      typeof selectedColumnObj?.columnDef.header === "string"
        ? selectedColumnObj.columnDef.header
        : selectedColumn;

    switch (filterType) {
      case "select":
        return (
          <AutoCompleteMultiselect
            label={`${columnDisplayName} Filter`}
            options={filterConfig?.options || []}
            placeholder={`Select ${columnDisplayName}`}
            onSelect={(val) => onValueChange(val)}
            id={`filter-${selectedColumn}`}
          />
        );

      case "date":
        return (
          <div className="flex gap-2">
            <DatePicker
              onChange={(date) => onRangeChange(date, filterRangeValue.end)}
              slotProps={{
                textField: {
                  placeholder: "Start date",
                  name: "date-filter-start",
                },
              }}
              name="date-filter-start"
            >
              {`${columnDisplayName} Start`}
            </DatePicker>
            <DatePicker
              onChange={(date) => onRangeChange(filterRangeValue.start, date)}
              slotProps={{
                textField: {
                  placeholder: "End date",
                  name: "date-filter-end",
                },
              }}
              name="date-filter-end"
            >
              {`${columnDisplayName} End`}
            </DatePicker>
          </div>
        );

      case "text":
      default:
        return (
          <TextInput
            label={`${columnDisplayName} Filter`}
            name={`filter-${selectedColumn}`}
            placeholder={`Filter ${columnDisplayName}`}
            value={filterValue as string}
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
      <div className="ml-2 mb-2 mr-2 flex items-center gap-2 text-sm">
        <Select
          label="Filter by:"
          options={columnOptions}
          placeholder="Select a Column..."
          value={selectedColumn}
          onSelect={(val) => setSelectedColumn(val)}
          id="filter-by-column"
        />

        {renderFilterInput()}
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}
