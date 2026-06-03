import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/index";
import { useDialog } from "components/dialog/DialogContext";
import { isDeliverableEditable } from "components/dialog/deliverable";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";

import { selectionTooltip } from "./actionTooltips";
import type { FormattedDeliverableTableRow } from "./DeliverableTable";

export const DELIVERABLE_CANT_DELETE_HAS_FILES =
  "Cannot Delete -\nHas Files or Comments";

const hasFilesOrComments = (deliverable: FormattedDeliverableTableRow): boolean =>
  Boolean(deliverable.cmsDocuments?.length) ||
  Boolean(deliverable.stateDocuments?.length) ||
  Boolean(deliverable.publicComments?.length) ||
  Boolean(deliverable.privateComments?.length);

const getDeletableDeliverables = (
  deliverables: FormattedDeliverableTableRow[]
): FormattedDeliverableTableRow[] =>
  deliverables.filter((deliverable) => !hasFilesOrComments(deliverable));

const getDeleteTooltip = (
  selectedCount: number,
  deletableSelectedCount: number
): string => {
  if (selectedCount === 0) return "Select a Deliverable to Delete";
  if (deletableSelectedCount === 0) return DELIVERABLE_CANT_DELETE_HAS_FILES;

  return selectionTooltip({
    action: "Delete",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "atLeast", count: 1 },
  });
};
/**
 * Action buttons for Deliverables Table.
 */
export const DeliverableActionButtons: React.FC<{
  table: TanstackTable<FormattedDeliverableTableRow>;
}> = ({ table }) => {
  const { showEditDeliverableDialog, showRemoveDeliverableDialog } = useDialog();
  // Conditions!
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedDeliverables = selectedRows.map((row) => row.original);
  // Delete Controls
  const deletableSelectedDeliverables = getDeletableDeliverables(selectedDeliverables);
  const deletableSelectedCount = deletableSelectedDeliverables.length;
  const deleteEnabled = deletableSelectedCount >= 1;
  const oneSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;
  // Edit Controls
  const selectedIsEditable =
    oneSelectedDeliverable === null || isDeliverableEditable(oneSelectedDeliverable.status);
  const editEnabled = selectedCount === 1 && selectedIsEditable;

  const baseEditTooltip = selectionTooltip({
    action: "Edit",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "exactly", count: 1 },
  });
  const editTooltip =
    selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;
  const deleteTooltip = getDeleteTooltip(selectedCount, deletableSelectedCount);

  return (
    <div className="flex gap-1 ml-4">
      <CircleButton
        name="edit-deliverable"
        ariaLabel="Edit Deliverable"
        tooltip={editTooltip}
        disabled={!editEnabled}
        onClick={() => {
          if (oneSelectedDeliverable) {
            showEditDeliverableDialog(oneSelectedDeliverable);
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
        onClick={() => {
          showRemoveDeliverableDialog(
            deletableSelectedDeliverables.map((deliverable) => deliverable.id),
            () => table.resetRowSelection()
          );
        }}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
};
