import * as React from "react";

import { compareAsc } from "date-fns";
import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon, ExportIcon } from "components/icons";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
// import { useDialog } from "components/dialog/DialogContext";
import { TypesColumns } from "../columns/TypesColumns";
import { Demonstration as ServerDemonstration } from "demos-server";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { useDialog } from "components/dialog/DialogContext";
import { Notice } from "components/notice";

export type TypeTableRow = {
  id: string;
  typeLabel: string;
  status: DemonstrationDetailDemonstrationType["status"];
  effectiveDate: Date;
  expirationDate: Date;
};

export type Demonstration = Pick<ServerDemonstration, "id" | "status"> & {
  demonstrationTypes: DemonstrationDetailDemonstrationType[];
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
  const columns = TypesColumns();
  const { showRemoveDemonstrationTypesDialog } = useDialog();

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
        effectiveDate: new Date(type.effectiveDate),
        expirationDate: new Date(type.expirationDate),
      }));
  }, [demonstration.demonstrationTypes]);

  const canRemove = (selected: TypeTableRow[]) => {
    if (selected.length < 1) {
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
            const selected = table.getSelectedRowModel().rows.map((r) => r.original);
            const editDisabled = selected.length !== 1;

            return (
              <div className="flex gap-1 ml-4">
                <CircleButton
                  name="add-type"
                  ariaLabel="Add Type"
                  disabled={inputDisabled}
                  onClick={() =>
                    // !addDisabled && showAddTypeDialog()
                    console.log("Add Type Clicked")
                  }
                >
                  <ExportIcon />
                </CircleButton>

                <CircleButton
                  name="edit-type"
                  ariaLabel="Edit Type"
                  disabled={editDisabled || inputDisabled}
                  onClick={() =>
                    // !editDisabled && showEditTypeDialog(selected[0])
                    console.log("Edit Type Clicked", selected[0])
                  }
                >
                  <EditIcon />
                </CircleButton>

                <CircleButton
                  name="remove-type"
                  ariaLabel="Remove Type"
                  disabled={!canRemove(selected) || inputDisabled}
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
