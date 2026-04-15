import React, { useState } from "react";
import type { Deliverable, PersonType } from "demos-server";
import type { DeliverableTableRow as DeliverablesPageTableRow } from "pages/DeliverablesPage";

import { DeliverableColumns } from "../columns/DeliverableColumns";
import { Table, type TableProps } from "../Table";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { KeywordSearch } from "../KeywordSearch";
import { CircleButton } from "components/index";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { selectionTooltip } from "./actionTooltips";
import { ImportIcon } from "components/icons/Action/ImportIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import { EditDeliverableDialog, isDeliverableEditable } from "components/dialog/deliverable";

export type DeliverableTableRow = DeliverablesPageTableRow;
export type DeliverableTableViewMode = Exclude<PersonType, "non-user-contact">;

const EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const NO_RESULTS_FOUND = "No results were returned. Adjust your search and filter criteria.";

export const formatDeliverableStatus = ({ status }: Pick<Deliverable, "status">) => status;

export const DeliverableTable: React.FC<{
  deliverables: DeliverableTableRow[];
  emptyRowsMessage?: string;
  viewMode: DeliverableTableViewMode;
}> = ({ deliverables, emptyRowsMessage = EMPTY_ROWS_MESSAGE, viewMode }) => {
  const deliverableColumns = DeliverableColumns({ viewMode });
  const formattedDeliverables = sortDeliverablesByDefault(deliverables).map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  const [deliverableBeingEdited, setDeliverableBeingEdited] = useState<DeliverableTableRow | null>(
    null
  );

  const showAddDeliverableDialog = () => {};
  const showRemoveDeliverableDialog = () => {};
  type DeliverableActionButtons = NonNullable<TableProps<DeliverableTableRow>["actionButtons"]>;

  const renderActionButtons: DeliverableActionButtons = (table) => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedCount = selectedRows.length;
    const singleSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;

    const selectedIsEditable =
      singleSelectedDeliverable === null || isDeliverableEditable(singleSelectedDeliverable.status);
    const editEnabled = selectedCount === 1 && selectedIsEditable;
    const deleteEnabled = selectedCount >= 1;

    const baseEditTooltip = selectionTooltip({
      action: "Edit",
      nounSingular: "Deliverable",
      selectedCount,
      rule: { kind: "exactly", count: 1 },
    });
    const editTooltip =
      selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;

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
          onClick={() => {
            if (singleSelectedDeliverable) {
              setDeliverableBeingEdited(singleSelectedDeliverable);
            }
          }}
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
  };

  const actionButtons = viewMode === "demos-state-user" ? undefined : renderActionButtons;

  return (
    <div className="flex flex-col gap-[24px]" data-view-mode={viewMode}>
      {deliverableColumns && (
        <Table<DeliverableTableRow>
          data={formattedDeliverables}
          columns={deliverableColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={NO_RESULTS_FOUND}
          actionButtons={actionButtons}
        />
      )}
      {deliverableBeingEdited && (
        <EditDeliverableDialog
          deliverable={deliverableBeingEdited}
          onClose={() => setDeliverableBeingEdited(null)}
        />
      )}
    </div>
  );
};
