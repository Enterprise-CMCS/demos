import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { EditIcon } from "components/icons";

import type { DemonstrationTypeUsageRow } from "./DemonstrationTypeUsageTable";

export const EDIT_TYPE_TAG_BUTTON_NAME = "edit-type-tag";
export const EDIT_TYPE_TAG_ENABLED_TOOLTIP = "Edit";
export const EDIT_TYPE_TAG_DISABLED_TOOLTIP = "Select a Type/Tag to Edit";

export const TypeTagActionButtons = ({
  table,
}: {
  table: TanstackTable<DemonstrationTypeUsageRow>;
}) => {
  const { showEditTypeTagDialog } = useDialog();
  const selectedRows = table.getSelectedRowModel().rows;
  const editEnabled = selectedRows.length === 1;

  const handleEdit = () => {
    if (!editEnabled) return;

    // Core rows ignore the keyword search, so a match hidden by the search still counts.
    const allTypeTagNames = table
      .getCoreRowModel()
      .rows.map((row) => row.original.demonstrationTypeName);
    showEditTypeTagDialog(selectedRows[0].original.demonstrationTypeName, allTypeTagNames);
  };

  return (
    <div className="flex gap-1 ml-4">
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
