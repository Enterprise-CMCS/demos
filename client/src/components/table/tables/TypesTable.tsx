import * as React from "react";
import { useToast } from "components/toast";
import { useLazyQuery } from "@apollo/client";

import { compareAsc } from "date-fns";
import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon, ExportIcon } from "components/icons";
import { KeywordSearch } from "components/table/search";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { TypesColumns } from "../columns/TypesColumns";
import { Deliverable, Demonstration as ServerDemonstration, Tag } from "demos-server";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { useDialog } from "components/dialog/DialogContext";
import { Notice } from "components/notice";
import { selectionTooltip } from "./actionTooltips";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import {
  AssociatedRecordsDemonstration,
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
} from "./TypeTagAssociatedRecordsTable";

export type TypeTableRow = {
  id: string;
  typeLabel: string;
  status: DemonstrationDetailDemonstrationType["status"];
  approvalStatus: DemonstrationDetailDemonstrationType["approvalStatus"];
  effectivePlainDate: string;
  expirationPlainDate: string;
};

export type Demonstration = Pick<ServerDemonstration, "id" | "status"> & {
  demonstrationTypes: DemonstrationDetailDemonstrationType[];
  deliverables?: (Pick<Deliverable, "id"> & {
    demonstrationTypes: Pick<Tag, "tagName">[];
  })[];
};

export type TypesTableProps = {
  demonstration: Demonstration;
  inputDisabled?: boolean;
  hideSearch?: boolean;
};

export const TypesTable: React.FC<TypesTableProps> = ({
  demonstration,
  inputDisabled = false,
  hideSearch = false,
}) => {
  const { currentUser } = getCurrentUser();
  const { showError } = useToast();
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [loadRecords] = useLazyQuery<{ demonstrations: AssociatedRecordsDemonstration[] }>(
    TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
    { fetchPolicy: "network-only" }
  );
  const isReadonlyUser = isReadonly(currentUser, "ApplicationWorkflow");

  const columns = TypesColumns(isReadonlyUser);
  const { showRemoveDemonstrationTypesDialog, showEditDemonstrationTypeDialog } = useDialog();

  /*
   * Ensure initial sort by createdAt date ascending
   * and map to expected data structure
   */
  const typeRows: TypeTableRow[] = React.useMemo(() => {
    return [...demonstration.demonstrationTypes]
      .sort((a, b) => compareAsc(a.createdAt, b.createdAt))
      .map((type) => ({
        id: type.demonstrationTypeName,
        typeLabel: type.demonstrationTypeName,
        status: type.status,
        approvalStatus: type.approvalStatus,
        effectivePlainDate: type.effectivePlainDate,
        expirationPlainDate: type.expirationPlainDate,
      }));
  }, [demonstration.demonstrationTypes]);

  const exportTypesExcel = async (typeNames: string[]) => {
    setExportingExcel(true);
    try {
      const { data, error } = await loadRecords();
      if (error) throw error;
      if (!data) throw new Error("No associated record data was returned.");
      await exportTypeTagRecords(
        typeNames.flatMap((typeName) =>
          sortAssociatedRecordsByDefault(buildAssociatedRecordRows(data.demonstrations, typeName))
        )
      );
    } catch (error) {
      console.error("Unable to export associated records", error);
      showError("Unable to export associated records. Please try again.");
    } finally {
      setExportingExcel(false);
    }
  };

  const linkedDemonstrationTypes = React.useMemo(() => {
    return new Set(
      demonstration.deliverables?.flatMap((deliverable) =>
        deliverable.demonstrationTypes.map((t) => t.tagName)
      ) || []
    );
  }, [demonstration.deliverables]);

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

  return (
    <div className="overflow-x-auto w-full mb-2 flex flex-col gap-1">
      {demonstration.status === "Approved" && (
        <Notice title="At least one demonstration type is required for approved demonstrations." />
      )}
      {columns && (
        <Table<TypeTableRow>
          data={typeRows}
          columns={columns}
          keywordSearch={!hideSearch ? (table) => <KeywordSearch table={table} /> : undefined}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage="You have no assigned Types at this time"
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
          actionButtons={(table) => {
            if (isReadonlyUser) {
              return null;
            }
            const selected = table.getSelectedRowModel().rows.map((r) => r.original);
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
                  onClick={() =>
                    exportTypesExcel(table.getRowModel().rows.map((row) => row.original.typeLabel))
                  }
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
          }}
        />
      )}
    </div>
  );
};
