import React from "react";
import { Table } from "../Table";
import { TabItem, Tabs } from "layout/Tabs";
import { DemonstrationColumns } from "../columns/DemonstrationColumns";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { DemonstrationStatus, State, User } from "demos-server";
import {
  Demonstration,
  DemonstrationAmendment,
  DemonstrationExtension,
} from "pages/DemonstrationsPage";

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
}> = ({ demonstrations, stateOptions, projectOfficerOptions, statusOptions }) => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const demonstrationColumns = DemonstrationColumns(
    stateOptions,
    projectOfficerOptions,
    statusOptions
  );

  const currentUserId = "1"; // Replace with actual current user ID from auth context

  const myDemos: Demonstration[] = demonstrations.filter(
    (demo: Demonstration) => demo.projectOfficer.id === currentUserId
  );

  const allDemos: Demonstration[] = demonstrations;

  const tabList: TabItem[] = [
    {
      value: "my",
      label: "My Demonstrations",
      count: myDemos.length,
    },
    {
      value: "all",
      label: "All Demonstrations",
      count: allDemos.length,
    },
  ];

  const dataToShow = tab === "my" ? myDemos : allDemos;
  const emptyRowsMessage =
    tab === "my"
      ? "You have no assigned demonstrations at this time."
      : "No demonstrations are tracked.";
  const noResultsFoundMessage = "No results were returned. Adjust your search and filter criteria.";

  return (
    <div>
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />
      {demonstrationColumns && (
        <Table<GenericDemonstrationTableRow>
          data={dataToShow.map((demonstration) => ({
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
