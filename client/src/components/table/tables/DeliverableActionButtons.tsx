import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/index";
import { useDialog } from "components/dialog/DialogContext";
import { isDeliverableEditable } from "components/dialog/deliverable";
import { DeleteIcon } from "components/icons/Action/DeleteIcon";
import { EditIcon } from "components/icons/Navigation/EditIcon";

import { selectionTooltip } from "./actionTooltips";
import type { FormattedDeliverableTableRow } from "./DeliverableTable";

export const DeliverableActionButtons: React.FC<{
  table: TanstackTable<FormattedDeliverableTableRow>;
}> = ({ table }) => {
  const { showEditDeliverableDialog } = useDialog();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const singleSelectedDeliverable = selectedCount === 1 ? selectedRows[0].original : null;

  const selectedIsEditable =
    singleSelectedDeliverable === null || isDeliverableEditable(singleSelectedDeliverable.status);
  const allSelectedAreDeletable = selectedRows.every((row) =>
    isDeliverableEditable(row.original.status)
  );
  const editEnabled = selectedCount === 1 && selectedIsEditable;
  const deleteEnabled = selectedCount >= 1 && allSelectedAreDeletable;

  const baseEditTooltip = selectionTooltip({
    action: "Edit",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "exactly", count: 1 },
  });
  const editTooltip =
    selectedCount === 1 && !selectedIsEditable ? "Select a Deliverable to Edit" : baseEditTooltip;

  const baseDeleteTooltip = selectionTooltip({
    action: "Delete",
    nounSingular: "Deliverable",
    selectedCount,
    rule: { kind: "atLeast", count: 1 },
  });
  const deleteTooltip =
    selectedCount >= 1 && !allSelectedAreDeletable
      ? "Finalized Deliverables cannot be deleted"
      : baseDeleteTooltip;

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
        onClick={() => {}}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
};
