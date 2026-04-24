import React from "react";
import { createColumnHelper, Table as TanstackTable } from "@tanstack/react-table";

import { ColumnFilter } from "components/table/ColumnFilter";
import { KeywordSearch, highlightCell } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { Table } from "components/table/Table";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { createSelectColumnDef } from "components/table/columns/selectColumn";

export const HISTORY_TAB_NAME = "history-tab";

export type DeliverableHistoryRow = {
  id: string;
  event: string;
  date: Date;
  user: string;
  details: string;
};

const INITIAL_TABLE_STATE = { sorting: [{ id: "date", desc: true }] };

const renderKeywordSearch = (table: TanstackTable<DeliverableHistoryRow>) => (
  <KeywordSearch table={table} />
);
const renderColumnFilter = (table: TanstackTable<DeliverableHistoryRow>) => (
  <ColumnFilter table={table} />
);
const renderPagination = (table: TanstackTable<DeliverableHistoryRow>) => (
  <PaginationControls table={table} />
);

function makeHistoryColumns() {
  const columnHelper = createColumnHelper<DeliverableHistoryRow>();
  return [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("event", {
      header: "Event",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    createDateColumnDef(columnHelper, "date", "Date"),
    columnHelper.accessor("user", {
      header: "User",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("details", {
      header: "Details",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
  ];
}

export const HistoryTab: React.FC<{ rows: DeliverableHistoryRow[] }> = ({ rows }) => {
  return (
    <div data-testid={HISTORY_TAB_NAME} className="flex flex-col gap-1">
      <Table<DeliverableHistoryRow>
        data={rows}
        columns={makeHistoryColumns()}
        keywordSearch={renderKeywordSearch}
        columnFilter={renderColumnFilter}
        pagination={renderPagination}
        initialState={INITIAL_TABLE_STATE}
        emptyRowsMessage="No history available."
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      />
    </div>
  );
};
