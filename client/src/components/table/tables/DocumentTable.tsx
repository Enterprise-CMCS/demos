// DocumentTable.tsx
import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  PaginationState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

import { DocumentColumns } from "components/table/columns/DocumentColumns";
import {
  AutoCompleteSelect,
  Option,
} from "components/input/select/AutoCompleteSelect";
import { PaginationControls } from "components/table/PaginationControls";

export interface RawDocument {
  id: number;
  title: string;
  description: string;
  type: string;
  uploadedBy: string;
  uploadDate: string; // ISO string date
  createdAt: string;
  updatedAt: string;
}

interface DocumentTableProps {
  data: RawDocument[];
  className?: string;
}

type FilterType = "" | "type" | "uploadDate";

const typeOptions: Option[] = [
  { label: "Pre-Submission Concept", value: "Pre-Submission Concept" },
  { label: "General File", value: "General File" },
];

export function DocumentTable({ data, className = "" }: DocumentTableProps) {
  const [filterBy, setFilterBy] = React.useState<FilterType>("");
  const [typeFilter, setTypeFilter] = React.useState<string>("");
  const [dateFilter, setDateFilter] = React.useState<string>("");

  // Build columnFilters for react-table based on the selected filter
  const columnFilters: ColumnFiltersState = React.useMemo(() => {
    if (filterBy === "type" && typeFilter) {
      return [{ id: "type", value: typeFilter }];
    }
    if (filterBy === "uploadDate" && dateFilter) {
      return [{ id: "uploadDate", value: dateFilter }];
    }
    return [];
  }, [filterBy, typeFilter, dateFilter]);

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "uploadDate", desc: true },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable<RawDocument>({
    data,
    columns: DocumentColumns,
    state: {
      sorting,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: () => {}, // controlled by filter UI
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualFiltering: false,
  });

  return (
    <div className={`overflow-x-auto w-full ${className} mb-2`}>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="filterBy" className="font-semibold">
            Filter By:
          </label>
          <div className="flex gap-1">
            <select
              id="filterBy"
              className="border px-2 py-1 rounded"
              value={filterBy}
              onChange={(e) => {
                setFilterBy(e.target.value as FilterType);
                setTypeFilter("");
                setDateFilter("");
              }}
            >
              <option value="">Select filter</option>
              <option value="type">Type</option>
              <option value="uploadDate">Upload Date</option>
            </select>
            {filterBy === "type" && (
              <div className="w-48">
                {/* TODO: This needs to be updated to multiselect once implemented */}
                <AutoCompleteSelect
                  options={typeOptions}
                  placeholder="Select document type"
                  value={typeFilter}
                  onSelect={(val) => setTypeFilter(val)}
                  id="documentTypeFilter"
                />
              </div>
            )}

            {filterBy === "uploadDate" && (
              <input
                type="date"
                id="uploadDateFilter"
                data-testid="upload-date-filter"
                className="border border-gray-300 rounded px-2 py-1"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      <table className="w-full table-fixed text-sm border-collapse border border-gray-200">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-gray-100">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-1 text-left border-b border-gray-300 cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : header.column.columnDef.header instanceof Function
                      ? header.column.columnDef.header(header.getContext())
                      : header.column.columnDef.header}
                  {{
                    asc: " ↑",
                    desc: " ↓",
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length}
                className="px-4 py-8 text-center text-gray-600"
              >
                No documents match your filter criteria.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border-b border-gray-200 px-2 py-1"
                  >
                    {cell.column.columnDef.cell instanceof Function
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.getValue()}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <hr className="border-t-2 border-gray-400 my-4" />
      <PaginationControls table={table} />
    </div>
  );
}
