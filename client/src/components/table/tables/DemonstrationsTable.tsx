import React, { useEffect } from "react";

import { TabItem, Tabs } from "layout/Tabs";
import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../search/KeywordSearch";
import { SecondaryButton } from "components/button";
import { Table } from "../Table";
import { useUserOperations } from "hooks/useUserOperations";
import { useStates } from "hooks/useStates";
import { useDemonstrationStatus } from "hooks/useDemonstrationStatus";
import { Demonstration } from "demos-server";
import { useDemonstration } from "hooks/useDemonstration";

export const DemonstrationsTable: React.FC = () => {
  const { getAllUsers } = useUserOperations();
  const {
    trigger: triggerGetAllProjectOfficers,
    data: projectOfficersData,
    loading: projectOfficersLoading,
    error: projectOfficersError,
  } = getAllUsers;
  useEffect(() => {
    triggerGetAllProjectOfficers();
  }, []);

  const { getAllStates } = useStates();
  const {
    trigger: triggerGetAllStates,
    data: statesData,
    loading: statesLoading,
    error: statesError,
  } = getAllStates;
  useEffect(() => {
    triggerGetAllStates();
  }, []);

  const { getAllDemonstrationStatuses } = useDemonstrationStatus();
  const {
    trigger: triggerGetAllDemonstrationStatuses,
    data: demonstrationStatusesData,
    loading: demonstrationStatusesLoading,
    error: demonstrationStatusesError,
  } = getAllDemonstrationStatuses;
  useEffect(() => {
    triggerGetAllDemonstrationStatuses();
  }, []);

  const [tab, setTab] = React.useState<"my" | "all">("my");
  const { getAllDemonstrations } = useDemonstration();
  const {
    trigger: triggerGetAllDemonstrations,
    data: demonstrationsData,
    loading: demonstrationsLoading,
    error: demonstrationsError,
  } = getAllDemonstrations;
  useEffect(() => {
    triggerGetAllDemonstrations();
  }, []);

  if (
    demonstrationsLoading ||
    projectOfficersLoading ||
    statesLoading ||
    demonstrationStatusesLoading
  ) {
    return <div className="p-4">Loading...</div>;
  }
  if (demonstrationsError || projectOfficersError || statesError || demonstrationStatusesError) {
    return <div className="p-4">Error loading demonstrations:</div>;
  }
  if (!demonstrationsData || !projectOfficersData || !statesData || !demonstrationStatusesData) {
    return <div className="p-4">No data available</div>;
  }

  const columnHelper = createColumnHelper<Demonstration>();
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
    columnHelper.accessor("state.stateName", {
      id: "stateName",
      header: "State/Territory",
      cell: highlightCell,
      meta: {
        filterConfig: {
          filterType: "select",
          options: statesData?.map((state) => ({
            label: state.stateCode,
            value: state.stateName,
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
      meta: {
        filterConfig: {
          filterType: "select",
          options: projectOfficersData?.map((officer) => ({
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
      meta: {
        filterConfig: {
          filterType: "select",
          options: demonstrationStatusesData?.map((demonstrationStatus) => ({
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

  const myDemonstrations: Demonstration[] = demonstrationsData.filter(
    (demo: Demonstration) =>
      demo.users.some((user) => user.id === currentUserId)
  );

  const tabList: TabItem[] = [
    {
      value: "my",
      label: "My Demonstrations",
      count: myDemonstrations.length,
    },
    {
      value: "all",
      label: "All Demonstrations",
      count: demonstrationsData.length,
    },
  ];

  const dataToShow = tab === "my" ? myDemonstrations : demonstrationsData;
  const emptyRowsMessage =
    tab === "my"
      ? "You have no assigned demonstrations at this time."
      : "No demonstrations are tracked.";
  const noResultsFoundMessage =
    "No results were returned. Adjust your search and filter criteria.";

  return (
    <>
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />
      <Table<Demonstration>
        data={dataToShow}
        columns={demonstrationColumns}
        keywordSearch
        columnFilter
        pagination
        emptyRowsMessage={emptyRowsMessage}
        noResultsFoundMessage={noResultsFoundMessage}
      />
    </>
  );
};
