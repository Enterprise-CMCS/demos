import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/index";
import { useDialog } from "components/dialog/DialogContext";
import {
  DELIVERABLE_CANT_DELETE_HAS_FILES,
  isDeliverableEditable,
} from "components/dialog/deliverable";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";

import { selectionTooltip } from "./actionTooltips";
import type { FormattedDeliverableTableRow } from "./DeliverableTable";

export const DeliverableActionButtons: React.FC<{
  table: TanstackTable<FormattedDeliverableTableRow>;
}> = ({ table }) => {
  const { showEditDeliverableDialog, showRemoveDeliverableDialog } = useDialog();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedDeliverables = selectedRows.map((row) => row.original);
  const singleSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;

  const selectedIsEditable =
    singleSelectedDeliverable === null || isDeliverableEditable(singleSelectedDeliverable.status);
  const selectedIncludesFilesOrComments = selectedDeliverables.some(
    (deliverable) =>
      Boolean(deliverable.cmsDocuments?.length) ||
      Boolean(deliverable.stateDocuments?.length) ||
      Boolean(deliverable.publicComments?.length) ||
      Boolean(deliverable.privateComments?.length)
  );
  const editEnabled = selectedCount === 1 && selectedIsEditable;
  const deleteEnabled = selectedCount >= 1 && !selectedIncludesFilesOrComments;

  const baseEditTooltip = selectionTooltip({
    action: "Edit",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "exactly", count: 1 },
  });
  const editTooltip =
    selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;

  const deleteTooltip = (() => {
    if (selectedCount === 0) return "Select a Deliverable to Delete";
    if (selectedIncludesFilesOrComments) return DELIVERABLE_CANT_DELETE_HAS_FILES;

    return selectionTooltip({
      action: "Delete",
      nounSingular: "Deliverable",
      selectedCount,
      rule: { kind: "atLeast", count: 1 },
    });
  })();

  return (
    <div className="flex gap-1 ml-4">
      <CircleButton
        name="edit-deliverable"
        ariaLabel="Edit Deliverable"
        tooltip={editTooltip}
        disabled={!editEnabled}
        onClick={() => {
          if (singleSelectedDeliverable) {
            showEditDeliverableDialog(singleSelectedDeliverable);
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
        <DeleteIcon />
      </CircleButton>
    </div>
  );
};
