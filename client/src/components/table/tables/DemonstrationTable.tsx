import React from "react";

import { TabItem, Tabs } from "layout/Tabs";
import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../search/KeywordSearch";
import { SecondaryButton } from "components/button";
import { Table } from "../Table";
import {
  DemonstrationTableRow,
  useDemonstration,
} from "hooks/useDemonstration";
import { useDemonstrationStatus } from "hooks/useDemonstrationStatus";
import { useState } from "hooks/useState";
import { useUserOperations } from "hooks/useUserOperations";

export const DemonstrationTable: React.FC = () => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const { getUserOptions } = useUserOperations();
  const { getStateOptions } = useState();
  const { getDemonstrationStatusOptions } = useDemonstrationStatus();
  const { getDemonstrationTable } = useDemonstration();

  const {
    trigger: triggerUserOptions,
    data: projectOfficersData,
    loading: projectOfficersLoading,
    error: projectOfficersError,
  } = getUserOptions;
  const {
    trigger: triggerStateOptions,
    data: statesData,
    loading: statesLoading,
    error: statesError,
  } = getStateOptions;
  const {
    trigger: triggerDemonstrationStatuses,
    data: demonstrationStatusesData,
    loading: demonstrationStatusesLoading,
    error: demonstrationStatusesError,
  } = getDemonstrationStatusOptions;
  const {
    trigger: triggerDemonstrationTable,
    data: demonstrationsTableData,
    loading: demonstrationsTableLoading,
    error: demonstrationsTableError,
  } = getDemonstrationTable;
  React.useEffect(() => {
    triggerUserOptions();
    triggerStateOptions();
    triggerDemonstrationStatuses();
    triggerDemonstrationTable();
  }, []);

  if (projectOfficersLoading || statesLoading || demonstrationStatusesLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (projectOfficersError || statesError || demonstrationStatusesError) {
    return (
      <div className="p-4">
        Error loading data:{" "}
        {projectOfficersError?.message ||
          statesError?.message ||
          demonstrationStatusesError?.message}
      </div>
    );
  }

  if (demonstrationsTableLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (demonstrationsTableError) {
    return <div className="p-4">Error loading demonstrations</div>;
  }
  if (!demonstrationsTableData) {
    return <div className="p-4">Demonstration not found</div>;
  }

  if (!projectOfficersData || !statesData || !demonstrationStatusesData) {
    return <div className="p-4">Data not found</div>;
  }

  const columnHelper = createColumnHelper<DemonstrationTableRow>();
  const demonstrationColumns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          id="select-all-rows"
          type="checkbox"
          className="cursor-pointer"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          id={`select-row-${row.id}`}
          type="checkbox"
          className="cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      size: 20,
    }),
    columnHelper.accessor("state.name", {
      id: "stateName",
      header: "State/Territory",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: statesData.map((state) => ({
            label: state.id,
            value: state.name,
          })),
        },
      },
    }),
    columnHelper.accessor("name", {
      header: "Title",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("projectOfficer.fullName", {
      id: "projectOfficer",
      header: "Project Officer",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: projectOfficersData.map((officer) => ({
            label: officer.fullName,
            value: officer.fullName,
          })),
        },
      },
    }),
    columnHelper.accessor("demonstrationStatus.name", {
      id: "demonstrationStatus",
      header: "Status",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: demonstrationStatusesData.map((demonstrationStatus) => ({
            label: demonstrationStatus.name,
            value: demonstrationStatus.name,
          })),
        },
      },
    }),
    columnHelper.display({
      id: "viewDetails",
      cell: ({ row }) => {
        const handleClick = () => {
          const demoId = row.original.id;
          window.location.href = `/demonstrations/${demoId}`;
        };

        return (
          <SecondaryButton
            type="button"
            size="small"
            onClick={handleClick}
            className="px-2 py-0 text-sm font-medium"
          >
            View
          </SecondaryButton>
        );
      },
    }),
  ];

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: DemonstrationTableRow[] = demonstrationsTableData.filter(
    (demo: DemonstrationTableRow) =>
      demo.users.some((user) => user.id === currentUserId)
  );

  const allDemos: DemonstrationTableRow[] = demonstrationsTableData;

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

  return (
    <div>
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />
      <Table<DemonstrationTableRow>
        data={dataToShow}
        columns={demonstrationColumns}
        keywordSearch
        columnFilter
        pagination
        emptyRowsMessage={emptyRowsMessage}
        noResultsFoundMessage={noResultsFoundMessage}
      />
    </div>
  );
};
