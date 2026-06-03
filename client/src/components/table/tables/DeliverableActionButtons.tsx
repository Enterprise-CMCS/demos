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
  "Deliverables with comments or files cannot be deleted";

const hasFilesOrComments = (deliverable: FormattedDeliverableTableRow): boolean =>
  Boolean(deliverable.cmsDocuments?.length) ||
  Boolean(deliverable.stateDocuments?.length) ||
  Boolean(deliverable.publicComments?.length) ||
  Boolean(deliverable.privateComments?.length);

const getDeleteTooltip = (selectedCount: number, selectedHasFilesOrComments: boolean): string => {
  if (selectedCount === 0) return "Select a Deliverable to Delete";
  if (selectedHasFilesOrComments) return DELIVERABLE_CANT_DELETE_HAS_FILES;

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
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedDeliverables = selectedRows.map((row) => row.original);
  const selectedHasFilesOrComments = selectedDeliverables.some(hasFilesOrComments);
  const deleteEnabled = selectedCount >= 1 && !selectedHasFilesOrComments;
  const oneSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;
  const selectedIsEditable =
    oneSelectedDeliverable === null || isDeliverableEditable(oneSelectedDeliverable.status);
  const editEnabled = selectedCount === 1 && selectedIsEditable;
  const iconColor = deleteEnabled ? "var(--color-error-dark)" : "var(--color-gray-darker)";

  const baseEditTooltip = selectionTooltip({
    action: "Edit",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "exactly", count: 1 },
  });
  const editTooltip =
    selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;
  const deleteTooltip = getDeleteTooltip(selectedCount, selectedHasFilesOrComments);

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
            selectedDeliverables.map((deliverable) => deliverable.id),
            () => table.resetRowSelection()
          );
        }}
      >
        <DeleteIcon fill={iconColor} />
      </CircleButton>
    </div>
  );
};
