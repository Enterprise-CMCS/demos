import React from "react";

import { CircleButton } from "components/button/CircleButton";
import { SecondaryButton } from "components/button";
import { DeleteIcon, EditIcon } from "components/icons";
import { ColumnFilter } from "components/table/ColumnFilter";
import { KeywordSearch } from "components/table/search";
import { PaginationControls } from "components/table/PaginationControls";
import { Table, TableProps } from "components/table/Table";
import { enabledDisabledTooltip, selectionTooltip } from "components/table/tables/actionTooltips";

import type { DeliverableFileRow } from "./DeliverableFileTypes";

const INITIAL_TABLE_STATE = {
  sorting: [{ id: "createdAt", desc: true }],
};
const getFileActionTooltip = (
  action: "Edit" | "Delete",
  isFinalized: boolean,
  selectedCount: number,
  hasSubmittedFile = false
) => {
  if (isFinalized) {
    return `Cannot ${action} Finalized Deliverables`;
  }

  if (action === "Delete" && hasSubmittedFile) {
    return "Selection contains files that have been submitted. Cannot delete submitted files.";
  }

  return selectionTooltip({
    action,
    nounSingular: "File",
    selectedCount,
    rule: action === "Edit" ? { kind: "exactly", count: 1 } : { kind: "atLeast", count: 1 },
  });
};

const addFileTooltip = (isFinalized: boolean) => {
  if (isFinalized) {
    return "Files cannot be added to a Finalized deliverable.";
  }
  return enabledDisabledTooltip({
    enabledText: "Add File",
    disabled: isFinalized,
  });
};

export type DeliverableFileTableProps = {
  "data-testid": string;
  title: string;
  addButtonName: string;
  editButtonName: string;
  deleteButtonName: string;
  editAriaLabel: string;
  deleteAriaLabel: string;
  emptyMessage: string;
  files: DeliverableFileRow[];
  columns: TableProps<DeliverableFileRow>["columns"];
  onAdd: () => void;
  onEdit: (file: DeliverableFileRow) => void;
  onDelete: (fileIds: string[]) => void;
  footer?: React.ReactNode;
  showActions: boolean;
  isFinalized: boolean;
  isFileDeletionDisabled?: boolean;
};

export const DeliverableFileTable: React.FC<DeliverableFileTableProps> = ({
  "data-testid": testId,
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
  showActions,
  isFinalized,
  isFileDeletionDisabled = false,
}) => {
  const renderFileActions: NonNullable<TableProps<DeliverableFileRow>["actionButtons"]> = (
    table
  ) => {
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    const selectedCount = selectedRows.length;
    const hasSubmittedFile = selectedRows.some((row) => row.deliverableSubmissionAction);

    return (
      <div className="flex gap-1 ml-4">
        <CircleButton
          name={editButtonName}
          aria-label={editAriaLabel}
          tooltip={getFileActionTooltip("Edit", isFinalized, selectedCount, hasSubmittedFile)}
          disabled={isFinalized || selectedCount !== 1}
          onClick={() => onEdit?.(selectedRows[0])}
        >
          <EditIcon />
        </CircleButton>
        <CircleButton
          name={deleteButtonName}
          aria-label={deleteAriaLabel}
          tooltip={getFileActionTooltip("Delete", isFinalized, selectedCount, hasSubmittedFile)}
          disabled={isFileDeletionDisabled || hasSubmittedFile || selectedCount < 1}
          onClick={() => onDelete?.(selectedRows.map((row) => row.id))}
        >
          <DeleteIcon />
        </CircleButton>
      </div>
    );
  };

  return (
    <div data-testid={testId} className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[20px] font-bold uppercase text-brand">{title}</span>
        {showActions && (
          <SecondaryButton
            name={addButtonName}
            onClick={onAdd}
            disabled={isFinalized}
            tooltip={addFileTooltip(isFinalized)}
          >
            Add File(s)
          </SecondaryButton>
        )}
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
        actionButtons={showActions ? renderFileActions : undefined}
      />
      {footer}
    </div>
  );
};
