import React from "react";
import { gql, useQuery } from "@apollo/client";
import { createColumnHelper, SortingFn } from "@tanstack/react-table";
import { Person, PersonType, State, User } from "demos-server";
import { Table } from "components/table/Table";
import { highlightCell, KeywordSearch } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { formatDateForDisplay } from "util/formatDate";

export const USER_MANAGEMENT_TEST_ID = "user-management";

const UNASSIGNED = "-";
const ALL_STATES = "All States";
const SEARCH_STORAGE_KEY = "user-management-keyword-search";

const IDM_USER_ROLE_LABELS: Record<PersonType, string> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
  "non-user-contact": UNASSIGNED,
};

export type ManagedUser = Pick<User, "id" | "lastLogin"> & {
  person: Pick<Person, "id" | "fullName" | "email" | "personType"> & {
    states: Pick<State, "id" | "name">[];
  };
};

export const USER_MANAGEMENT_QUERY = gql`
  query GetUsersForUserManagement {
    users {
      id
      lastLogin
      person {
        id
        fullName
        email
        personType
        states {
          id
          name
        }
      }
    }
  }
`;

// Only state users can hold states; enforced server-side by checkPersonIsStateUser.
const getAssignedStates = (user: ManagedUser): string => {
  if (user.person.personType !== "demos-state-user") {
    return ALL_STATES;
  }
  const stateNames = user.person.states
    .map((state) => state.name)
    .sort((a, b) => a.localeCompare(b));
  return stateNames.length > 0 ? stateNames.join(", ") : UNASSIGNED;
};

const getLastLogin = (user: ManagedUser): string =>
  user.lastLogin ? formatDateForDisplay(user.lastLogin) : UNASSIGNED;

// Default order lives in the data: TanStack drops sort state for non-sortable columns.
const sortUnassignedFirstThenByName = (users: ManagedUser[]): ManagedUser[] =>
  [...users].sort((userA, userB) => {
    const rank = (user: ManagedUser) => (getAssignedStates(user) === UNASSIGNED ? 0 : 1);
    return (
      rank(userA) - rank(userB) || userA.person.fullName.localeCompare(userB.person.fullName)
    );
  });

// Accessor returns MM/DD/YYYY so search matches the screen; sort on the raw timestamp.
const sortByLastLoginDate: SortingFn<ManagedUser> = (rowA, rowB) => {
  const toTime = (user: ManagedUser) => (user.lastLogin ? new Date(user.lastLogin).getTime() : 0);
  return toTime(rowA.original) - toTime(rowB.original);
};

const columnHelper = createColumnHelper<ManagedUser>();
const userColumns = [
  columnHelper.accessor((user) => user.person.fullName, {
    id: "name",
    header: "Name",
    cell: highlightCell,
  }),
  columnHelper.accessor((user) => user.person.email, {
    id: "email",
    header: "Email",
    enableSorting: false,
    cell: highlightCell,
  }),
  columnHelper.accessor((user) => IDM_USER_ROLE_LABELS[user.person.personType], {
    id: "idmUserRole",
    header: "IDM User Role",
    cell: highlightCell,
  }),
  columnHelper.accessor(getAssignedStates, {
    id: "assignedStates",
    header: "Assigned to State(s)",
    enableSorting: false,
    cell: highlightCell,
  }),
  columnHelper.accessor(getLastLogin, {
    id: "lastLogin",
    header: "Last Login",
    sortingFn: sortByLastLoginDate,
    cell: highlightCell,
  }),
];

export const UserManagement: React.FC = () => {
  const { data, loading, error } = useQuery<{ users: ManagedUser[] }>(USER_MANAGEMENT_QUERY);

  const orderedUsers = React.useMemo(
    () => sortUnassignedFirstThenByName(data?.users ?? []),
    [data?.users]
  );

  if (loading) {
    return <div data-testid={USER_MANAGEMENT_TEST_ID}>Loading users...</div>;
  }

  if (error || !data) {
    return <div data-testid={USER_MANAGEMENT_TEST_ID}>Error loading users.</div>;
  }

  return (
    <div data-testid={USER_MANAGEMENT_TEST_ID}>
      <Table<ManagedUser>
        data={orderedUsers}
        columns={userColumns}
        keywordSearch={(table) => <KeywordSearch table={table} storageKey={SEARCH_STORAGE_KEY} />}
        pagination={(table) => <PaginationControls table={table} />}
        emptyRowsMessage="No users available."
        noResultsFoundMessage="No results match your search"
      />
    </div>
  );
};
