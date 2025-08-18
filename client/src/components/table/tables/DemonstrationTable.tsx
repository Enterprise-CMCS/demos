import React from "react";
import { Table } from "../Table";
import { TabItem, Tabs } from "layout/Tabs";
import { DemonstrationColumns } from "../columns/DemonstrationColumns";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { Demonstration } from "demos-server";

export type DemonstrationTableItem = {
  id: Demonstration["id"];
  name: Demonstration["name"];
  state: Pick<Demonstration["state"], "name">;
  projectOfficer: Pick<Demonstration["projectOfficer"], "fullName">;
  users: Pick<Demonstration["users"][number], "id">[];
  demonstrationStatus: Pick<Demonstration["demonstrationStatus"], "name">;
  amendments: {
    id: Demonstration["amendments"][number]["id"];
    name: Demonstration["amendments"][number]["name"];
    projectOfficer: Pick<Demonstration["amendments"][number]["projectOfficer"], "fullName">;
    amendmentStatus: Pick<Demonstration["amendments"][number]["amendmentStatus"], "name">;
  }[];
  extensions: {
    id: Demonstration["extensions"][number]["id"];
    name: Demonstration["extensions"][number]["name"];
    projectOfficer: Pick<Demonstration["extensions"][number]["projectOfficer"], "fullName">;
    extensionStatus: Pick<Demonstration["extensions"][number]["extensionStatus"], "name">;
  }[];
};

// --- Generic TableRow type for both demonstration and application rows ---
export type TableRow = {
  id: string;
  name: string;
  state?: { name: string };
  projectOfficer?: { fullName: string };
  users?: { id: string }[];
  amendments?: TableRow[];
  extensions?: TableRow[];
  applications?: TableRow[];
  type?: "amendment" | "extension";
  applicationStatus?: { name: string };
  demonstrationStatus?: { name: string };
  status?: { name: string };
  parentId?: string;
};

// Map demonstration data to generic TableRow
function mapToTableRow(item: DemonstrationTableItem): TableRow {
  const amendments = (item.amendments || []).map((app) => ({
    id: app.id,
    name: app.name,
    type: "amendment" as const,
    projectOfficer: app.projectOfficer,
    applicationStatus: app.amendmentStatus,
    state: item.state,
    status: app.amendmentStatus,
    parentId: item.id,
  }));

  const extensions = (item.extensions || []).map((app) => ({
    id: app.id,
    name: app.name,
    type: "extension" as const,
    projectOfficer: app.projectOfficer,
    applicationStatus: app.extensionStatus,
    state: item.state,
    status: app.extensionStatus,
    parentId: item.id,
  }));

  const applications = [...amendments, ...extensions];

  return {
    id: item.id,
    name: item.name,
    state: item.state,
    demonstrationStatus: item.demonstrationStatus,
    status: item.demonstrationStatus,
    projectOfficer: item.projectOfficer,
    users: item.users,
    amendments,
    extensions,
    applications,
  };
}

const getSubRows = (row: TableRow) => row.applications;

type DemonstrationTableProps = {
  demonstrations: DemonstrationTableItem[];
};

export const DemonstrationTable: React.FC<DemonstrationTableProps> = ({ demonstrations }) => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const { demonstrationColumns, demonstrationColumnsLoading, demonstrationColumnsError } =
    DemonstrationColumns();

  if (demonstrationColumnsLoading) return <div className="p-4">Loading...</div>;
  if (demonstrationColumnsError)
    return <div className="p-4">Error loading column data: {demonstrationColumnsError}</div>;

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: DemonstrationTableItem[] = demonstrations.filter((demo: DemonstrationTableItem) =>
    demo.users.some((user) => user.id === currentUserId)
  );

  const allDemos: DemonstrationTableItem[] = demonstrations;

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

  const tableRows: TableRow[] = dataToShow.map(mapToTableRow);

  return (
    <div>
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />
      {demonstrationColumns && (
        <Table<TableRow>
          data={tableRows}
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
