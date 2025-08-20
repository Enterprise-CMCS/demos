import React from "react";
import { Table } from "../Table";
import { TabItem, Tabs } from "layout/Tabs";
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
}> = ({ demonstrations, stateOptions, projectOfficerOptions, statusOptions }) => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const demonstrationColumns = DemonstrationColumns(
    stateOptions,
    projectOfficerOptions,
    statusOptions
  );

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: DemonstrationTableRow[] = demonstrations.filter((demo: DemonstrationTableRow) =>
    demo.users.some((user) => user.id === currentUserId)
  );

  const allDemos: DemonstrationTableRow[] = demonstrations;

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
