import React from "react";
import { Table } from "../Table";
import { DemonstrationColumns } from "../columns/DemonstrationColumns";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { BundleStatus, Person, State } from "demos-server";
import {
  Demonstration,
  DemonstrationAmendment,
  DemonstrationExtension,
} from "pages/DemonstrationsPage";

const DEFAULT_NO_SEARCH_RESULTS_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";
const DEFAULT_EMPTY_ROWS_MESSAGE = "No demonstrations are tracked.";

export type GenericDemonstrationTableRow =
  | (Demonstration & { type: "demonstration" })
  | (DemonstrationAmendment & {
      type: "amendment";
      state: Pick<State, "id">;
      status: BundleStatus;
      parentId: string;
      primaryProjectOfficer: Pick<Person, "fullName" | "id">;
    })
  | (DemonstrationExtension & {
      type: "extension";
      state: Pick<State, "id">;
      status: BundleStatus;
      parentId: string;
      primaryProjectOfficer: Pick<Person, "fullName" | "id">;
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
          parentId: row.id,
          primaryProjectOfficer: row.primaryProjectOfficer,
        }) as GenericDemonstrationTableRow
    ),
    ...row.extensions.map(
      (extension) =>
        ({
          ...extension,
          type: "extension",
          state: row.state,
          parentId: row.id,
          primaryProjectOfficer: row.primaryProjectOfficer,
        }) as GenericDemonstrationTableRow
    ),
  ];
};

export const DemonstrationTable: React.FC<{
  demonstrations: Demonstration[];
  projectOfficerOptions: Pick<Person, "fullName">[];
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}> = ({
  demonstrations,
  projectOfficerOptions,
  emptyRowsMessage = DEFAULT_EMPTY_ROWS_MESSAGE,
  noResultsFoundMessage = DEFAULT_NO_SEARCH_RESULTS_MESSAGE,
}) => {
  const demonstrationColumns = DemonstrationColumns(projectOfficerOptions);

  return (
    <div className="flex flex-col gap-[24px]">
      {demonstrationColumns && (
        <Table<GenericDemonstrationTableRow>
          data={demonstrations.map((demonstration) => ({
            ...demonstration,
            type: "demonstration",
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
