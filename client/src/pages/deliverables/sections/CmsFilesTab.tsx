import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/button/CircleButton";
import { SecondaryButton } from "components/button";
import { DeleteIcon, EditIcon } from "components/icons";
import { ColumnFilter } from "components/table/ColumnFilter";
import { KeywordSearch } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { Table } from "components/table/Table";
import { selectionTooltip } from "components/table/tables/actionTooltips";

import type { DeliverableFileRow } from "./DeliverableFileTypes";
import { makeCmsFileColumns } from "./fileColumns";

export const CMS_FILES_TAB_NAME = "cms-files-tab";
export const CMS_FILES_ADD_BUTTON_NAME = "button-add-cms-file";
export const CMS_FILES_EDIT_BUTTON_NAME = "button-edit-cms-file";
export const CMS_FILES_DELETE_BUTTON_NAME = "button-delete-cms-file";

const INITIAL_TABLE_STATE = { sorting: [{ id: "createdAt", desc: true }] };
const CMS_FILES_EMPTY_MESSAGE = "No files have been added yet.";

const renderKeywordSearch = (table: TanstackTable<DeliverableFileRow>) => (
  <KeywordSearch table={table} />
);
const renderColumnFilter = (table: TanstackTable<DeliverableFileRow>) => (
  <ColumnFilter table={table} />
);
const renderPagination = (table: TanstackTable<DeliverableFileRow>) => (
  <PaginationControls table={table} />
);

function makeCmsFilesActionButtons(
  onEdit: (file: DeliverableFileRow) => void,
  onDelete: (fileIds: string[]) => void
) {
  return function renderCmsFilesActionButtons(table: TanstackTable<DeliverableFileRow>) {
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
          name={CMS_FILES_EDIT_BUTTON_NAME}
          ariaLabel="Edit CMS File"
          tooltip={editTooltip}
          disabled={selectedCount !== 1}
          onClick={() => onEdit(selectedRows[0])}
        >
          <EditIcon />
        </CircleButton>
        <CircleButton
          name={CMS_FILES_DELETE_BUTTON_NAME}
          ariaLabel="Delete CMS File"
          tooltip={deleteTooltip}
          disabled={selectedCount < 1}
          onClick={() => onDelete(selectedRows.map((row) => row.id))}
        >
          <DeleteIcon />
        </CircleButton>
      </div>
    );
  };
}

export type CmsFilesTabProps = {
  files: DeliverableFileRow[];
  onAdd?: () => void;
  onEdit?: (file: DeliverableFileRow) => void;
  onDelete?: (fileIds: string[]) => void;
};

export const CmsFilesTab: React.FC<CmsFilesTabProps> = ({
  files,
  onAdd = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) => {
  const columns = makeCmsFileColumns();
  const actionButtons = React.useMemo(
    () => makeCmsFilesActionButtons(onEdit, onDelete),
    [onEdit, onDelete]
  );

  return (
    <div data-testid={CMS_FILES_TAB_NAME} className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[20px] font-bold uppercase text-brand">CMS Files</span>
        <SecondaryButton name={CMS_FILES_ADD_BUTTON_NAME} onClick={onAdd}>
          Add File(s)
        </SecondaryButton>
      </div>
      <Table<DeliverableFileRow>
        data={files}
        columns={columns}
        keywordSearch={renderKeywordSearch}
        columnFilter={renderColumnFilter}
        pagination={renderPagination}
        initialState={INITIAL_TABLE_STATE}
        emptyRowsMessage={CMS_FILES_EMPTY_MESSAGE}
        noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
        actionButtons={actionButtons}
      />
    </div>
  );
};
