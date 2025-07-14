import React from "react";

import { TabItem, Tabs } from "layout/Tabs";
import { gql, useQuery } from "@apollo/client";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { highlightText, KeywordSearch } from "components/table/search/KeywordSearch";
import { SecondaryButton } from "components/button";
import { Table } from "components/table/Table";
import { ColumnFilterByDropdown } from "components/table/filters/ColumnFilterSelect";
import { PaginationControls } from "components/table/pagination/PaginationControls";

type Demonstration = {
  id: string;
  name: string;
  description: string;
  demonstrationStatus: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    stateName: string;
    stateCode: string;
  };
  projectOfficer: {
    id: string;
    fullName: string;
  };
  users: {
    id: string;
    fullName: string;
  }[];
}

export const DEMONSTRATIONS_TABLE_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      demonstrationStatus {
        id
        name
      }
      state {
        id
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
      projectOfficer {
        id
        fullName
      }
    }
  }
`;

export const Demonstrations: React.FC = () => {
  const { data, error, loading } = useQuery(DEMONSTRATIONS_TABLE_QUERY);

  // Tab state management
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const columnHelper = createColumnHelper<Demonstration>();

  const columns = [
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
      cell: ({ row, table }) => {
        const value = row.getValue("stateName") as string;
        const searchQuery = table.getState().globalFilter || "";
        return highlightText(value, searchQuery);
      },
    }),
    columnHelper.accessor("name", {
      header: "Title",
      cell: ({ row, table }) => {
        const value = row.getValue("name") as string;
        const searchQuery = table.getState().globalFilter || "";
        return highlightText(value, searchQuery);
      },
    }),
    columnHelper.accessor("projectOfficer.fullName", {
      id: "projectOfficer",
      header: "Project Officer",
      cell: ({ row, table }) => {
        const value = row.getValue("projectOfficer") as string;
        const searchQuery = table.getState().globalFilter || "";
        return highlightText(value, searchQuery);
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
  ] as ColumnDef<Demonstration, unknown>[];

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!data || !data.demonstrations) {
    return null;
  }

  // Filter demonstrations based on current user
  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: Demonstration[] = data.demonstrations.filter(
    (demo: Demonstration) => demo.users.some(user => user.id === currentUserId)
  );

  const allDemos: Demonstration[] = data.demonstrations;

  // Create tab configuration
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

  // Determine which data to show based on selected tab
  const dataToShow = tab === "my" ? myDemos : allDemos;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>

      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />

      <Table<Demonstration>
        data={dataToShow}
        columns={columns}
        keywordSearch={<KeywordSearch />}
        columnFilter={<ColumnFilterByDropdown />}
        pagination={<PaginationControls />}
      />
    </div>
  );
};
