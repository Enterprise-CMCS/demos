import React from "react";
import { gql, useQuery } from "@apollo/client";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { isUnassigned, ManagedUser, UserManagementColumns } from "../columns/UserManagementColumns";

const SEARCH_STORAGE_KEY = "user-management-keyword-search";

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

// Default order lives in the data: TanStack drops sort state for non-sortable columns.
const sortUnassignedFirstThenByName = (users: ManagedUser[]): ManagedUser[] =>
  [...users].sort((userA, userB) => {
    const rank = (user: ManagedUser) => (isUnassigned(user) ? 0 : 1);
    return rank(userA) - rank(userB) || userA.person.fullName.localeCompare(userB.person.fullName);
  });

export const UserManagementTable: React.FC = () => {
  const { data, loading, error } = useQuery<{ users: ManagedUser[] }>(USER_MANAGEMENT_QUERY);

  const orderedUsers = React.useMemo(
    () => sortUnassignedFirstThenByName(data?.users ?? []),
    [data?.users]
  );

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error || !data) {
    return <div>Error loading users.</div>;
  }

  return (
    <Table<ManagedUser>
      data={orderedUsers}
      columns={UserManagementColumns()}
      keywordSearch={(table) => <KeywordSearch table={table} storageKey={SEARCH_STORAGE_KEY} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No users available."
      noResultsFoundMessage="No results match your search"
    />
  );
};
