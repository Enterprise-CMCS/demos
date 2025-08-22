import React from "react";
import { Table } from "../Table";
import { DemonstrationColumns } from "../columns/DemonstrationColumns";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { DemonstrationStatus, State, User } from "demos-server";
import {
  Demonstration,
  DemonstrationAmendment,
  DemonstrationExtension,
} from "pages/Demonstrations";

const EMPTY_ROWS_MESSAGE = "No demonstrations are tracked.";
const NO_RESULTS_FOUND_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

export type GenericDemonstrationTableRow =
  | (Demonstration & { type: "demonstration" })
  | (DemonstrationAmendment & {
      type: "amendment";
      state: Pick<State, "name">;
      status: Pick<DemonstrationStatus, "name">;
      parentId: string;
    })
  | (DemonstrationExtension & {
      type: "extension";
      state: Pick<State, "name">;
      status: Pick<DemonstrationStatus, "name">;
      parentId: string;
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
          parentId: row.id,
        }) as GenericDemonstrationTableRow
    ),
    ...row.extensions.map(
      (extension) =>
        ({
          ...extension,
          type: "extension",
          state: row.state,
          status: extension.extensionStatus,
          parentId: row.id,
        }) as GenericDemonstrationTableRow
    ),
  ];
};

export const DemonstrationTable: React.FC<{
  demonstrations: Demonstration[];
  projectOfficerOptions: Pick<User, "fullName">[];
  stateOptions: Pick<State, "name" | "id">[];
  statusOptions: Pick<DemonstrationStatus, "name">[];
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
