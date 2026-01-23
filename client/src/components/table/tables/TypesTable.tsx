import * as React from "react";

import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon } from "components/icons";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
// import { useDialog } from "components/dialog/DialogContext";
import { TypesColumns } from "../columns/TypesColumns";

import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";

export type TypeTableRow = {
  id: string;
  typeLabel: string;
  status: DemonstrationDetailDemonstrationType["status"];
  effectiveDate: Date;
  expirationDate: Date;
};

export type TypesTableProps = {
  types: DemonstrationDetailDemonstrationType[];
};

export const TypesTable: React.FC<TypesTableProps> = ({ types }) => {
  const columns = TypesColumns();
  // const { showEditTypeDialog, showRemoveTypeDialog } = useDialog();

  const typeRows: TypeTableRow[] = types.map((a) => ({
    id: a.demonstrationType,
    typeLabel: a.demonstrationType,
    status: a.status,
    effectiveDate: new Date(a.effectiveDate),
    expirationDate: new Date(a.expirationDate),
  }));

  const initialState = {
    sorting: [{ id: "effectiveDate", desc: false }],
  };

  return (
    <div className="overflow-x-auto w-full mb-2">
      {columns && (
        <Table<TypeTableRow>
          data={typeRows}
          columns={columns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage="You have no assigned Types at this time"
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
          initialState={initialState}
          actionButtons={(table) => {
            const selected = table.getSelectedRowModel().rows.map((r) => r.original);
            const editDisabled = selected.length !== 1;
            const removeDisabled = selected.length < 1;

            return (
              <div className="flex gap-1 ml-4">
                <CircleButton
                  name="edit-type"
                  ariaLabel="Edit Type"
                  disabled={editDisabled}
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
                  disabled={removeDisabled}
                  onClick={() =>
                    // !removeDisabled && showRemoveTypeDialog(selected.map((t) => t.id))
                    console.log("Remove Type Clicked", selected.map((t) => t.id))
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
