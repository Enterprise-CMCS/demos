import React from "react";
import { ColumnDef } from "@tanstack/react-table";

import { CircleButton } from "components/button/CircleButton";
import { SecondaryButton } from "components/button";
import { DeleteIcon, EditIcon } from "components/icons";
import { ColumnFilter } from "components/table/ColumnFilter";
import { KeywordSearch } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { Table } from "components/table/Table";
import { selectionTooltip } from "components/table/tables/actionTooltips";

import type { DeliverableFileRow } from "./DeliverableFileTypes";

const INITIAL_TABLE_STATE = { sorting: [{ id: "createdAt", desc: true }] };

export type DeliverableFileTableProps = {
  testId: string;
  title: string;
  addButtonName: string;
  editButtonName: string;
  deleteButtonName: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
  emptyMessage: string;
  files: DeliverableFileRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<DeliverableFileRow, any>[];
  onAdd?: () => void;
  onEdit?: (file: DeliverableFileRow) => void;
  onDelete?: (fileIds: string[]) => void;
  footer?: React.ReactNode;
};

export const DeliverableFileTable: React.FC<DeliverableFileTableProps> = ({
  testId,
  title,
  addButtonName,
  editButtonName,
  deleteButtonName,
  editAriaLabel,
  deleteAriaLabel,
  emptyMessage,
  files,
  columns,
  onAdd,
  onEdit,
  onDelete,
  footer,
}) => (
  <div data-testid={testId} className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[20px] font-bold uppercase text-brand">{title}</span>
      <SecondaryButton name={addButtonName} onClick={onAdd}>
        Add File(s)
      </SecondaryButton>
    </div>
    <Table<DeliverableFileRow>
      data={files}
      columns={columns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      initialState={INITIAL_TABLE_STATE}
      emptyRowsMessage={emptyMessage}
      noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
      actionButtons={(table) => {
        const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
        const selectedCount = selectedRows.length;

        const editTooltip = selectionTooltip({
          action: "Edit",
          nounSingular: "File",
          selectedCount,
          rule: { kind: "exactly", count: 1 },
        });
        const deleteTooltip = selectionTooltip({
          action: "Delete",
          nounSingular: "File",
          selectedCount,
          rule: { kind: "atLeast", count: 1 },
        });

        return (
          <div className="flex gap-1 ml-4">
            <CircleButton
              name={editButtonName}
              ariaLabel={editAriaLabel}
              tooltip={editTooltip}
              disabled={selectedCount !== 1}
              onClick={() => onEdit?.(selectedRows[0])}
            >
              <EditIcon />
            </CircleButton>
            <CircleButton
              name={deleteButtonName}
              ariaLabel={deleteAriaLabel}
              tooltip={deleteTooltip}
              disabled={selectedCount < 1}
              onClick={() => onDelete?.(selectedRows.map((row) => row.id))}
            >
              <DeleteIcon />
            </CircleButton>
          </div>
        );
      }}
    />
    {footer}
  </div>
);
