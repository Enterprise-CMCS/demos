import React, { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useToast } from "components/toast";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import {
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
  AssociatedRecordsDemonstration,
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
} from "./TypeTagAssociatedRecordsTable";
import type { Table as TanstackTable } from "@tanstack/react-table";

import { CircleButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { ApproveIcon, DeleteIcon, EditIcon, ExportIcon } from "components/icons";

import type { DemonstrationTypeUsageRow } from "./DemonstrationTypeUsageTable";

export const EDIT_TYPE_TAG_BUTTON_NAME = "edit-type-tag";
export const EDIT_TYPE_TAG_ENABLED_TOOLTIP = "Edit";
export const EDIT_TYPE_TAG_DISABLED_TOOLTIP = "Select a Type/Tag to Edit";

export const APPROVE_TYPE_TAG_BUTTON_NAME = "approve-type-tag";
export const APPROVE_TYPE_TAG_ENABLED_TOOLTIP = "Approve";
export const APPROVE_TYPE_TAG_DISABLED_TOOLTIP = "Select Unapproved Type/Tag to Approve";

export const DELETE_TYPE_TAG_BUTTON_NAME = "delete-type-tag";
export const DELETE_TYPE_TAG_ENABLED_TOOLTIP = "Delete";
export const DELETE_TYPE_TAG_DISABLED_NOSELECTED_TOOLTIP = "Select a Type/Tag to Delete";
export const DELETE_TYPE_TAG_DISABLED_HASUSAGE_TOOLTIP = "Cannot Delete Type/Tag in use";

export const TypeTagActionButtons = ({
  table,
}: {
  table: TanstackTable<DemonstrationTypeUsageRow>;
}) => {
  const { showEditTypeTagDialog, showApproveTypeTagDialog, showDeleteTypeTagDialog } = useDialog();
  const { showError } = useToast();
  const [exporting, setExporting] = useState(false);
  const [loadRecords] = useLazyQuery<{
    demonstrations: AssociatedRecordsDemonstration[];
  }>(TYPE_TAG_ASSOCIATED_RECORDS_QUERY, { fetchPolicy: "network-only" });
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedUnapprovedRows = selectedRows.filter(
    (row) => row.original.approvalStatus !== "Approved"
  );
  const selectedRowsWithUsage = selectedRows.filter((row) => row.original.totalUsage > 0);

  const editEnabled = selectedRows.length === 1;
  const approveEnabled = selectedUnapprovedRows.length > 0;
  const deleteEnabled = selectedRows.length > 0 && selectedRowsWithUsage.length === 0;

  const deleteDisabledTooltip =
    selectedRowsWithUsage.length > 0
      ? DELETE_TYPE_TAG_DISABLED_HASUSAGE_TOOLTIP
      : DELETE_TYPE_TAG_DISABLED_NOSELECTED_TOOLTIP;

  const handleExport = async () => {
    const tagNames = table
      .getSortedRowModel()
      .rows.map((row) => row.original.demonstrationTypeName);
    setExporting(true);
    try {
      const { data, error } = await loadRecords();
      if (error) throw error;
      if (!data) throw new Error("No associated record data was returned.");
      await exportTypeTagRecords(
        tagNames.flatMap((tagName) =>
          sortAssociatedRecordsByDefault(buildAssociatedRecordRows(data.demonstrations, tagName))
        )
      );
    } catch (error) {
      console.error("Unable to export associated records", error);
      showError("Unable to export associated records. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
    showApproveTypeTagDialog(
      selectedUnapprovedRows.map((row) => row.original.demonstrationTypeName)
    );
  };
  const handleDelete = () => {
    if (!deleteEnabled) return;
    showDeleteTypeTagDialog(selectedRows.map((row) => row.original.demonstrationTypeName));
  };

  return (
    <div className="flex gap-1 ml-4">
      <CircleButton
        name="export-type-tags"
        aria-label="Export Type/Tags"
        tooltip="Export Excel"
        disabled={exporting}
        onClick={handleExport}
      >
        <ExportIcon />
      </CircleButton>
      <CircleButton
        name={DELETE_TYPE_TAG_BUTTON_NAME}
        aria-label="Delete Type/Tag"
        tooltip={deleteEnabled ? DELETE_TYPE_TAG_ENABLED_TOOLTIP : deleteDisabledTooltip}
        disabled={!deleteEnabled}
        onClick={handleDelete}
      >
        <DeleteIcon />
      </CircleButton>
      <CircleButton
        name={APPROVE_TYPE_TAG_BUTTON_NAME}
        aria-label="Approve Type/Tag"
        tooltip={
          approveEnabled ? APPROVE_TYPE_TAG_ENABLED_TOOLTIP : APPROVE_TYPE_TAG_DISABLED_TOOLTIP
        }
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
