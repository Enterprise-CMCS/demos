import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { ApproveIcon, EditIcon } from "components/icons";

import type { DemonstrationTypeUsageRow } from "./DemonstrationTypeUsageTable";

export const EDIT_TYPE_TAG_BUTTON_NAME = "edit-type-tag";
export const EDIT_TYPE_TAG_ENABLED_TOOLTIP = "Edit";
export const EDIT_TYPE_TAG_DISABLED_TOOLTIP = "Select a Type/Tag to Edit";

export const APPROVE_TYPE_TAG_BUTTON_NAME = "approve-type-tag";
export const APPROVE_TYPE_TAG_ENABLED_TOOLTIP = "Approve";
export const APPROVE_TYPE_TAG_DISABLED_TOOLTIP = "Select Unapproved Type/Tag to Approve";

export const TypeTagActionButtons = ({
  table,
}: {
  table: TanstackTable<DemonstrationTypeUsageRow>;
}) => {
  const { showEditTypeTagDialog, showApproveTypeTagDialog } = useDialog();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedUnapprovedRows = selectedRows.filter((row) => row.original.approvalStatus !== "Approved");

  const editEnabled = selectedRows.length === 1;
  const approveEnabled = selectedUnapprovedRows.length > 0;

  const handleEdit = () => {
    if (!editEnabled) return;

    // Core rows ignore the keyword search, so a match hidden by the search still counts.
    const allTypeTagNames = table
      .getCoreRowModel()
      .rows.map((row) => row.original.demonstrationTypeName);
    showEditTypeTagDialog(selectedRows[0].original.demonstrationTypeName, allTypeTagNames);
  };
  const handleApprove = () => {
    if (!approveEnabled) return;
    showApproveTypeTagDialog(selectedUnapprovedRows.map((row) => row.original.demonstrationTypeName));
  };

  return (
    <div className="flex gap-1 ml-4">
      <CircleButton
        name={APPROVE_TYPE_TAG_BUTTON_NAME}
        aria-label="Approve Type/Tag"
        tooltip={approveEnabled ? APPROVE_TYPE_TAG_ENABLED_TOOLTIP : APPROVE_TYPE_TAG_DISABLED_TOOLTIP}
        disabled={!approveEnabled}
        onClick={handleApprove}
      >
        <ApproveIcon />
      </CircleButton>
      <CircleButton
        name={EDIT_TYPE_TAG_BUTTON_NAME}
        aria-label="Edit Type/Tag"
        tooltip={editEnabled ? EDIT_TYPE_TAG_ENABLED_TOOLTIP : EDIT_TYPE_TAG_DISABLED_TOOLTIP}
        disabled={!editEnabled}
        onClick={handleEdit}
      >
        <EditIcon />
      </CircleButton>
    </div>
  );
};
