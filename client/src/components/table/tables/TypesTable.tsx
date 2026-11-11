import * as React from "react";
import { useToast } from "components/toast";
import { gql, TypedDocumentNode, useLazyQuery, useQuery } from "@apollo/client";

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
import { DemosApplicationSection, getCurrentUser, isReadonly } from "components/user/UserContext";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import {
  AssociatedRecordsDemonstration,
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
} from "./TypeTagAssociatedRecordsTable";
import { Table as TanstackTable } from "@tanstack/react-table";
import { DemonstrationDetail } from "pages/DemonstrationDetail";

export type TypeTableRow = {
  id: string;
  typeLabel: string;
  status: DemonstrationDetailDemonstrationType["status"];
  approvalStatus: DemonstrationDetailDemonstrationType["approvalStatus"];
  effectivePlainDate: string;
  expirationPlainDate: string;
};

export const TYPES_TABLE_ACTION_BUTTONS_QUERY: TypedDocumentNode<
  {
    demonstration: Pick<ServerDemonstration, "id" | "status"> & {
      deliverables: (Pick<Deliverable, "id"> & { demonstrationTypes: Pick<Tag, "tagName">[] })[];
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
  table,
  demonstrationId,
  inputDisabled,
}: {
  table: TanstackTable<TypeTableRow>;
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
};

export const TypesTable = ({
  demonstration,
  applicationSection,
  inputDisabled = false,
  hideSearch = false,
}: {
  demonstration: Pick<DemonstrationDetail, "id" | "status" | "demonstrationTypes">;
  applicationSection: DemosApplicationSection;
  inputDisabled?: boolean;
  hideSearch?: boolean;
}) => {
  const { currentUser } = getCurrentUser();
  const isReadonlyUser = isReadonly(currentUser, applicationSection);

  const columns = TypesColumns(isReadonlyUser);

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
          actionButtons={(table) =>
            !isReadonlyUser && (
              <TypesTableActionButtons
                table={table}
                demonstrationId={demonstration.id}
                inputDisabled={inputDisabled}
              />
            )
          }
        />
      )}
    </div>
  );
};
