import { gql, TypedDocumentNode, useLazyQuery, useQuery } from "@apollo/client";
import { useDialog } from "components/dialog/DialogContext";
import { useToast } from "components/toast";
import React from "react";
import {
  AssociatedRecordsDemonstration,
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
} from "../TypeTagAssociatedRecordsTable";
import {
  Deliverable as ServerDeliverable,
  Demonstration as ServerDemonstration,
  Tag as ServerTag,
} from "demos-server";
import { TypeTableRow } from "./TypesTable";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import { selectionTooltip } from "../actionTooltips";
import { CircleButton } from "components/button";
import { DeleteIcon, EditIcon, ExportIcon } from "components/icons";

export const TYPES_TABLE_ACTION_BUTTONS_QUERY: TypedDocumentNode<
  {
    demonstration: Pick<ServerDemonstration, "id" | "status"> & {
      deliverables: (Pick<ServerDeliverable, "id"> & {
        demonstrationTypes: Pick<ServerTag, "tagName">[];
      })[];
      demonstrationTypes: object[];
    };
  },
  { id: string }
> = gql`
  query TypesTableActionButtonsQuery($id: ID!) {
    demonstration(id: $id) {
      id
      status
      deliverables {
        id
        demonstrationTypes {
          tagName
        }
      }
      demonstrationTypes {
        __typename
      }
    }
  }
`;

export const TypesTableActionButtons = ({
  rows,
  selectedRows,
  demonstrationId,
  inputDisabled,
}: {
  rows: TypeTableRow[];
  selectedRows: TypeTableRow[];
  demonstrationId: string;
  inputDisabled: boolean;
}) => {
  const { showRemoveDemonstrationTypesDialog, showEditDemonstrationTypeDialog } = useDialog();
  const { showError } = useToast();
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [loadRecords] = useLazyQuery<{ demonstrations: AssociatedRecordsDemonstration[] }>(
    TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
    { fetchPolicy: "network-only" }
  );

  const { data, loading, error } = useQuery(TYPES_TABLE_ACTION_BUTTONS_QUERY, {
    variables: { id: demonstrationId },
  });

  const linkedDemonstrationTypes = React.useMemo(() => {
    return new Set(
      data?.demonstration.deliverables?.flatMap((deliverable) =>
        deliverable.demonstrationTypes.map((t) => t.tagName)
      ) || []
    );
  }, [data]);

  if (loading) return null;
  if (error || !data) {
    return <span className="text-error text-sm">Unable to load demonstration data.</span>;
  }
  const demonstration = data.demonstration;

  const exportTypesExcel = async (typeNames: string[]) => {
    setExportingExcel(true);
    try {
      const { data, error } = await loadRecords();
      if (error) throw error;
      if (!data) throw new Error("No associated record data was returned.");
      const rows = typeNames.flatMap((typeName) =>
        sortAssociatedRecordsByDefault(buildAssociatedRecordRows(data.demonstrations, typeName))
      );
      if (rows.length === 0) {
        showError("No associated records are available to export.");
        return;
      }
      await exportTypeTagRecords(rows);
    } catch (error) {
      console.error("Unable to export associated records", error);
      showError("Unable to export associated records. Please try again.");
    } finally {
      setExportingExcel(false);
    }
  };

  const hasLinkedType = (selected: TypeTableRow[]) =>
    selected.some((type) => linkedDemonstrationTypes.has(type.typeLabel));

  const canRemove = (selected: TypeTableRow[]) => {
    if (selected.length < 1) {
      return false;
    }
    if (hasLinkedType(selected)) {
      return false;
    }
    if (
      selected.length === demonstration.demonstrationTypes.length &&
      demonstration.status === "Approved"
    ) {
      return false;
    }
    return true;
  };

  const selected = selectedRows;
  const selectedCount = selected.length;
  const editDisabled = selectedCount !== 1;
  const removeDisabled = !canRemove(selected) || inputDisabled;

  // Tooltips
  const editTooltip = selectionTooltip({
    action: "Edit",
    nounSingular: "Type",
    selectedCount,
    rule: { kind: "exactly", count: 1 },
  });

  // Determine removeTooltip based on why it's disabled
  let removeTooltip: string;
  if (!removeDisabled) {
    removeTooltip = "Delete";
  } else if (selectedCount < 1) {
    removeTooltip = selectionTooltip({
      action: "Delete",
      nounSingular: "Type",
      selectedCount,
      rule: { kind: "atLeast", count: 1 },
    });
  } else if (hasLinkedType(selected)) {
    removeTooltip = "Linked to a deliverable";
  } else if (
    demonstration.status === "Approved" &&
    selectedCount === demonstration.demonstrationTypes.length
  ) {
    removeTooltip = "1 Type is Required";
  } else {
    removeTooltip = "Delete";
  }

  return (
    <div className="flex gap-1 ml-4">
      <CircleButton
        name="export-type-excel"
        aria-label="Export Types as Excel"
        tooltip={exportingExcel ? "Exporting Excel…" : "Export Excel"}
        disabled={exportingExcel}
        onClick={() => exportTypesExcel(rows.map((row) => row.typeLabel))}
      >
        <ExportIcon />
      </CircleButton>
      <CircleButton
        name="edit-type"
        aria-label="Edit Type"
        tooltip={editTooltip}
        disabled={editDisabled || inputDisabled}
        onClick={() =>
          !editDisabled &&
          showEditDemonstrationTypeDialog(demonstration.id, {
            demonstrationTypeName: selected[0].typeLabel,
            status: selected[0].status,
            approvalStatus: selected[0].approvalStatus,
            effectivePlainDate: selected[0].effectivePlainDate,
            expirationPlainDate: selected[0].expirationPlainDate,
          })
        }
      >
        <EditIcon />
      </CircleButton>

      <CircleButton
        name="delete-type"
        aria-label="Delete Type"
        tooltip={removeTooltip}
        disabled={removeDisabled}
        onClick={() =>
          canRemove(selected) &&
          showRemoveDemonstrationTypesDialog(
            demonstration.id,
            selected.map((t) => t.typeLabel)
          )
        }
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
};
