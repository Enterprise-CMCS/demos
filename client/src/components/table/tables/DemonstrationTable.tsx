import React from "react";
import { Table } from "../Table";
import {
  DemonstrationColumns,
  StateOption,
  StatusOption,
  UserOption,
} from "../columns/DemonstrationColumns";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { Amendment, DemonstrationStatus, State, User } from "demos-server";

const EMPTY_ROWS_MESSAGE = "No demonstrations are tracked.";
const NO_RESULTS_FOUND_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

type DemonstrationTableState = Pick<State, "name">;
type DemonstrationTableProjectOfficer = Pick<User, "fullName">;
type DemonstrationTableUser = Pick<User, "id">;
type DemonstrationTableStatus = Pick<DemonstrationStatus, "name">;
type DemonstrationTableAmendment = Pick<Amendment, "id" | "name"> & {
  projectOfficer: DemonstrationTableProjectOfficer;
  amendmentStatus: DemonstrationTableStatus;
};
type DemonstrationTableExtension = Pick<Amendment, "id" | "name"> & {
  projectOfficer: DemonstrationTableProjectOfficer;
  extensionStatus: DemonstrationTableStatus;
};

export type DemonstrationTableRow = {
  id: string;
  name: string;
  state: DemonstrationTableState;
  projectOfficer: DemonstrationTableProjectOfficer;
  users: DemonstrationTableUser[];
  demonstrationStatus: DemonstrationTableStatus;
  amendments: DemonstrationTableAmendment[];
  extensions: DemonstrationTableExtension[];
};

export type GenericDemonstrationTableRow =
  | (DemonstrationTableRow & { type: "demonstration" })
  | (DemonstrationTableAmendment & {
      type: "amendment";
      parentId: string;
      state: DemonstrationTableState;
      status: DemonstrationTableStatus;
    })
  | (DemonstrationTableExtension & {
      type: "extension";
      parentId: string;
      state: DemonstrationTableState;
      status: DemonstrationTableStatus;
    });

const getSubRows = (
  row: GenericDemonstrationTableRow
): GenericDemonstrationTableRow[] | undefined => {
  if (row.type !== "demonstration") return undefined;
  return [
    ...row.amendments.map(
      (amendment) =>
        ({
          ...amendment,
          type: "amendment",
          state: row.state,
          status: amendment.amendmentStatus,
        }) as GenericDemonstrationTableRow
    ),
    ...row.extensions.map(
      (extension) =>
        ({
          ...extension,
          type: "extension",
          state: row.state,
          status: extension.extensionStatus,
        }) as GenericDemonstrationTableRow
    ),
  ];
};

export const DemonstrationTable: React.FC<{
  demonstrations: DemonstrationTableRow[];
  stateOptions: StateOption[];
  projectOfficerOptions: UserOption[];
  statusOptions: StatusOption[];
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}> = ({
  demonstrations,
  stateOptions,
  projectOfficerOptions,
  statusOptions,
  emptyRowsMessage = EMPTY_ROWS_MESSAGE,
  noResultsFoundMessage = NO_RESULTS_FOUND_MESSAGE,
}) => {
  const demonstrationColumns = DemonstrationColumns(
    stateOptions,
    projectOfficerOptions,
    statusOptions
  );

  return (
    <div>
      {demonstrationColumns && (
        <Table<GenericDemonstrationTableRow>
          data={demonstrations.map((demonstration) => ({
            ...demonstration,
            type: "demonstration",
            status: demonstration.demonstrationStatus,
          }))}
          columns={demonstrationColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={noResultsFoundMessage}
          getSubRows={getSubRows}
        />
      )}
    </div>
  );
};
