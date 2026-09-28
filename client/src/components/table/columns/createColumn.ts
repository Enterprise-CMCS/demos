import { createColumnHelper, CellContext } from "@tanstack/react-table";
import { highlightCell } from "components/table";
import { createSelectColumnDef } from "./selectColumn";
import type { ColumnMetaFilterConfig } from "components/table/ColumnFilter";

export interface ColumnOptions<RowData> {
  enableSorting?: boolean;
  enableColumnFilter?: boolean;
  cell?: (info: CellContext<RowData, unknown>) => React.ReactNode;
  highlightSearchResults?: boolean;
  filterConfig?: ColumnMetaFilterConfig["filterConfig"];
}

// Generates a ID for a table column header by converting to lowercase and removing spaces
function generateHeaderId(header: string) {
  return header.toLowerCase().replace(/\s+/g, "");
}

// Merges provided options with defaults
function getOptions<RowData>(optionOverrides?: ColumnOptions<RowData>) {
  return {
    enableSorting: optionOverrides?.enableSorting ?? false,
    enableColumnFilter: optionOverrides?.enableColumnFilter ?? true,
    highlightSearchResults: optionOverrides?.highlightSearchResults !== false,
    cell: optionOverrides?.cell,
    filterConfig: optionOverrides?.filterConfig,
  };
}

// Creates a function that generates table columns with sensible defaults
export function getColumnBuilder<RowData>() {
  const createColumn = (
    accessor: (row: RowData) => string | number,
    header: string,
    optionOverrides?: ColumnOptions<RowData>
  ) => {
    const columnHelper = createColumnHelper<RowData>();
    const options = getOptions(optionOverrides);

    const cellRenderer = options.highlightSearchResults
      ? highlightCell
      : optionOverrides?.cell || ((info) => info.getValue());

    const columnConfig = {
      id: generateHeaderId(header),
      header,
      cell: cellRenderer,
      enableSorting: options.enableSorting,
      enableColumnFilter: options.enableColumnFilter,
      meta: options.filterConfig ? { filterConfig: options.filterConfig } : undefined,
    };

    return columnHelper.accessor(accessor, columnConfig);
  };

  const createDisplayColumn = (
    header: string,
    cell: (info: CellContext<RowData, unknown>) => React.ReactNode
  ) => {
    const columnHelper = createColumnHelper<RowData>();
    return columnHelper.display({
      id: generateHeaderId(header),
      header,
      cell,
    });
  };

  const createSelectColumn = () => {
    const columnHelper = createColumnHelper<RowData>();
    return createSelectColumnDef(columnHelper);
  };

  return { createColumn, createDisplayColumn, createSelectColumn };
}
