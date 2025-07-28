import React from "react";
import { Table } from "../Table";
import { TabItem, Tabs } from "layout/Tabs";
import {
  DemonstrationTableItem,
  useDemonstration,
} from "hooks/useDemonstration";
import { useDemonstrationColumns } from "../columns/useDemonstrationColumns";

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
};

// Map demonstration data to generic TableRow
function mapToTableRow(item: DemonstrationTableItem): TableRow {
  const amendments = (item.amendments || []).map((app) => ({
    id: app.name,
    name: app.name,
    type: "amendment" as const,
    projectOfficer: app.projectOfficer,
    applicationStatus: app.amendmentStatus,
    state: item.state,
    status: app.amendmentStatus,
  }));

  const extensions = (item.extensions || []).map((app) => ({
    id: app.name,
    name: app.name,
    type: "extension" as const,
    projectOfficer: app.projectOfficer,
    applicationStatus: app.extensionStatus,
    state: item.state,
    status: app.extensionStatus,
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

export const DemonstrationTable: React.FC = () => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const {
    demonstrationColumns,
    demonstrationColumnsLoading,
    demonstrationColumnsError,
  } = useDemonstrationColumns();

  const { getDemonstrationTable } = useDemonstration();
  const {
    data: demonstrationsTableData,
    loading: demonstrationsTableLoading,
    error: demonstrationsTableError,
  } = getDemonstrationTable;

  React.useEffect(() => {
    getDemonstrationTable.trigger();
  }, []);

  if (demonstrationColumnsLoading) return <div className="p-4">Loading...</div>;
  if (demonstrationColumnsError)
    return (
      <div className="p-4">Error loading data: {demonstrationColumnsError}</div>
    );
  if (demonstrationsTableLoading) return <div className="p-4">Loading...</div>;
  if (demonstrationsTableError)
    return <div className="p-4">Error loading demonstrations</div>;
  if (!demonstrationsTableData)
    return <div className="p-4">Demonstrations not found</div>;

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: DemonstrationTableItem[] = demonstrationsTableData.filter(
    (demo: DemonstrationTableItem) =>
      demo.users.some((user) => user.id === currentUserId)
  );

  const allDemos: DemonstrationTableItem[] = demonstrationsTableData;

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
  const noResultsFoundMessage =
    "No results were returned. Adjust your search and filter criteria.";

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
          keywordSearch
          columnFilter
          pagination
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={noResultsFoundMessage}
          getSubRows={getSubRows}
        />
      )}
    </div>
  );
};
