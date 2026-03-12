import React from "react";

import { Deliverable } from "pages/DeliverablesPage";
import { DeliverableColumns } from "../columns/DeliverableColumns";
import { Table } from "../Table";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { KeywordSearch } from "../KeywordSearch";
import { CircleButton } from "components/index";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { selectionTooltip } from "./actionTooltips";
import { ImportIcon } from "components/icons/Action/ImportIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";

export type DeliverableTableRow = {
  id: string;
  name: string;
  demonstrationName: string;
  deliverableType: string;
  dueDate: string;
  status: string;
  state: { id: string };
};

export const DeliverableTable: React.FC<{ deliverables: Deliverable[] }> = ({
  deliverables,
}) => {
  const deliverableColumns = DeliverableColumns();

  /* const { showAddDeliverableDialog, showEditDeliverableDialog, showRemoveDeliverableDialog } = useDialog(); */
  const showAddDeliverableDialog = () => { };
  const showEditDeliverableDialog = () => { };
  const showRemoveDeliverableDialog = () => { };

  return (
    <div className="flex flex-col gap-[24px]">
      {deliverableColumns && (
        <Table<DeliverableTableRow>
          data={deliverables}
          columns={deliverableColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage="No deliverables available."
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
          actionButtons={(table) => {
            const selectedDeliverables = table.getSelectedRowModel().rows.map((row) => row.original);
            const selectedCount = selectedDeliverables.length;

            const editEnabled = selectedCount === 1;
            const deleteEnabled = selectedCount >= 1;

            const editTooltip = selectionTooltip({
              action: "Edit",
              nounSingular: "Deliverable",
              selectedCount,
              rule: { kind: "exactly", count: 1 },
            });

            const deleteTooltip = selectionTooltip({
              action: "Delete",
              nounSingular: "Deliverable",
              selectedCount,
              rule: { kind: "atLeast", count: 1 },
            });

            return (
              <div className="flex gap-1 ml-4">
                <CircleButton
                  name="add-deliverable"
                  ariaLabel="Add Deliverable"
                  tooltip="Add Deliverable"
                  onClick={() => showAddDeliverableDialog()}
                >
                  <ImportIcon />
                </CircleButton>

                <CircleButton
                  name="edit-deliverable"
                  ariaLabel="Edit Deliverable"
                  tooltip={editTooltip}
                  disabled={!editEnabled}
                  onClick={() => showEditDeliverableDialog()}
                >
                  <EditIcon />
                </CircleButton>

                <CircleButton
                  name="remove-deliverable"
                  ariaLabel="Remove Deliverable"
                  tooltip={deleteTooltip}
                  disabled={!deleteEnabled}
                  onClick={() => showRemoveDeliverableDialog()}
                >
                  <DeleteIcon />
                </CircleButton>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};
