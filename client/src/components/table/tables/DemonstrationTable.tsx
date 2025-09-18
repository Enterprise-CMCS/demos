import React from "react";
import { Table } from "../Table";
import { TabItem, Tabs } from "layout/Tabs";
import { highlightCell, KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import {
  Demonstration as ServerDemonstration,
  DemonstrationStatus as ServerDemonstrationStatus,
  State as ServerState,
  User as ServerUser,
  Amendment,
  Extension,
} from "demos-server";
import { createColumnHelper } from "@tanstack/react-table";
import { createSelectColumnDef } from "../columns/selectColumn";
import { SecondaryButton } from "components/button";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import { gql, useQuery } from "@apollo/client";

export const DEMONSTRATION_TABLE_QUERY = gql`
  query DemonstrationsTable {
    demonstrations {
      id
      name
      demonstrationStatus {
        name
      }
      state {
        name
      }
      projectOfficer {
        id
        fullName
      }
      amendments {
        id
        name
        projectOfficer {
          id
          fullName
        }
        amendmentStatus {
          name
        }
      }
      extensions {
        id
        name
        projectOfficer {
          id
          fullName
        }
        extensionStatus {
          name
        }
      }
    }

    states {
      id
      name
    }

    users {
      id
      fullName
    }

    demonstrationStatuses {
      id
      name
    }
  }
`;

type State = Pick<ServerState, "id" | "name">;
type User = Pick<ServerUser, "fullName" | "id">;
type DemonstrationStatus = Pick<ServerDemonstrationStatus, "name">;
type Demonstration = Pick<ServerDemonstration, "id" | "name"> & {
  projectOfficer: User;
  state: State;
  demonstrationStatus: DemonstrationStatus;
  amendments: (Pick<Amendment, "id" | "name"> & {
    projectOfficer: User;
    amendmentStatus: DemonstrationStatus;
  })[];
  extensions: (Pick<Extension, "id" | "name"> & {
    projectOfficer: User;
    extensionStatus: DemonstrationStatus;
  })[];
};

type DemonstrationTableRow = Pick<ServerDemonstration, "id" | "name"> & {
  projectOfficer: User;
  state: State;
  status: DemonstrationStatus;
  parentId?: string;
  amendments?: DemonstrationTableRow[];
  extensions?: DemonstrationTableRow[];
  type: "Demonstration" | "Amendment" | "Extension";
};

function normalizeDemonstration(demonstration: Demonstration): DemonstrationTableRow {
  return {
    id: demonstration.id,
    name: demonstration.name,
    projectOfficer: demonstration.projectOfficer,
    state: demonstration.state,
    status: demonstration.demonstrationStatus,
    type: "Demonstration",
    amendments: demonstration.amendments.map((amendment) => ({
      id: amendment.id,
      name: amendment.name,
      projectOfficer: amendment.projectOfficer,
      state: demonstration.state, // Inherit state from parent demonstration
      status: amendment.amendmentStatus,
      parentId: demonstration.id,
      type: "Amendment",
    })),
    extensions: demonstration.extensions.map((extension) => ({
      id: extension.id,
      name: extension.name,
      projectOfficer: extension.projectOfficer,
      state: demonstration.state, // Inherit state from parent demonstration
      status: extension.extensionStatus,
      parentId: demonstration.id,
      type: "Extension",
    })),
  };
}

export const DemonstrationTable: React.FC = () => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const { data, loading, error } = useQuery<{
    demonstrations: Demonstration[];
    states: State[];
    users: User[];
    demonstrationStatuses: DemonstrationStatus[];
  }>(DEMONSTRATION_TABLE_QUERY);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const demonstrations = data?.demonstrations || [];
  const stateOptions = data?.states || [];
  const userOptions = data?.users || [];
  const statusOptions = data?.demonstrationStatuses || [];

  const columnHelper = createColumnHelper<DemonstrationTableRow>();
  const demonstrationColumns = [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("state.name", {
      id: "stateName",
      header: "State/Territory",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            stateOptions.map((state) => ({
              label: state.id,
              value: state.name,
            })) ?? [],
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
          options:
            userOptions.map((officer) => ({
              label: officer.fullName,
              value: officer.fullName,
            })) ?? [],
        },
      },
    }),
    columnHelper.display({
      id: "applications",
      header: "Applications",
      cell: ({ row }) => {
        if (row.original.type !== "Demonstration") {
          return <span>{row.original.type}</span>;
        }
        const amendmentsCount = row.original.amendments?.length ?? 0;
        const extensionsCount = row.original.extensions?.length ?? 0;
        return (
          <div>
            <div>Amendments ({amendmentsCount})</div>
            <div>Extensions ({extensionsCount})</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("status.name", {
      id: "status",
      header: "Status",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            statusOptions.map((status) => ({
              label: status.name,
              value: status.name,
            })) ?? [],
        },
      },
    }),
    columnHelper.display({
      id: "viewDetails",
      cell: ({ row }) => {
        // Always link to the parent demonstration page
        // If this row is an amendment or extension, use the parent id and add the correct query param
        let demoId = row.original.id;
        let queryParam = "";
        if (row.original.type === "Amendment" && row.original.parentId) {
          demoId = row.original.parentId;
          queryParam = `amendments=${row.original.id}`;
        } else if (row.original.type === "Extension" && row.original.parentId) {
          demoId = row.original.parentId;
          queryParam = `extensions=${row.original.id}`;
        }
        const href = queryParam
          ? `/demonstrations/${demoId}?${queryParam}`
          : `/demonstrations/${demoId}`;
        const handleClick = () => {
          window.location.href = href;
        };
        return (
          <SecondaryButton
            type="button"
            size="small"
            onClick={handleClick}
            name={`view-details-${row.original.id}`}
          >
            View
          </SecondaryButton>
        );
      },
    }),
    columnHelper.display({
      id: "expander",
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <button
            aria-label="expand"
            onClick={row.getToggleExpandedHandler()}
            style={{ cursor: "pointer" }}
          >
            {row.getIsExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </button>
        ) : (
          ""
        ),
    }),
  ];

  const currentUserId = "1";
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
        <Table<DemonstrationTableRow>
          data={dataToShow.map(normalizeDemonstration)}
          columns={demonstrationColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={noResultsFoundMessage}
          getSubRows={(originalRow) => {
            const subRows: DemonstrationTableRow[] = [];
            if (originalRow.amendments) {
              subRows.push(...originalRow.amendments);
            }
            if (originalRow.extensions) {
              subRows.push(...originalRow.extensions);
            }
            return subRows;
          }}
        />
      )}
    </div>
  );
};
