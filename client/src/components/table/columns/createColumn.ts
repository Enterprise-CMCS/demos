import { createColumnHelper, CellContext } from "@tanstack/react-table";
import { highlightCell } from "../KeywordSearch";

export interface ColumnOptions<RowData> {
  enableSorting?: boolean;
  className?: string;
  cell?: (info: CellContext<RowData, unknown>) => React.ReactNode;
  highlightSearchResults?: boolean;
}

type RowDataTypes = string | number;

// Generates a ID for a table column header by converting to lowercase and removing spaces
function generateHeaderId(header: string) {
  return header.toLowerCase().replace(/\s+/g, "");
}

// Merges provided options with defaults
function getOptions<RowData>(options?: ColumnOptions<RowData>) {
  return {
    enableSorting: options?.enableSorting ?? false,
    highlightSearchResults: options?.highlightSearchResults !== false,
    cell: options?.cell,
    className: options?.className,
  };
}

// Creates a function that generates table columns with sensible defaults
export function getColumnBuilder<RowData>() {
  const createColumn = (
    accessor: (row: RowData) => RowDataTypes,
    header: string,
    optionOverrides?: ColumnOptions<RowData>
  ) => {
    const columnHelper = createColumnHelper<RowData>();
    const options = getOptions(optionOverrides);

    const cellRenderer = options.highlightSearchResults
      ? highlightCell
      : optionOverrides?.cell || ((info) => info.getValue());

    return columnHelper.accessor(accessor, {
      id: generateHeaderId(header),
      header,
      cell: cellRenderer,
      enableSorting: options.enableSorting,
    });
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

  return { createColumn, createDisplayColumn };
}
