import React from "react";
import { gql, useQuery } from "@apollo/client";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { LoginHistoryUserRow, LoginHistoryColumns } from "../columns/LoginHistoryColumns";

export const LOGIN_HISTORY_QUERY = gql`
  query GetLoginHistory {
    users {
      id
      username
      lastLogin
      person {
        id
        fullName
        email
      }
    }
  }
`;

const sortByName = (users: LoginHistoryUserRow[]): LoginHistoryUserRow[] =>
  [...users].sort((userA, userB) => userA.person.fullName.localeCompare(userB.person.fullName));

export const LoginHistoryTable: React.FC = () => {
  const { data, loading, error } = useQuery<{ users: LoginHistoryUserRow[] }>(LOGIN_HISTORY_QUERY);
  const sortedUsers = React.useMemo(
    () => sortByName(data?.users ?? []),
    [data?.users]
  );

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error || !data) {
    return <div>Error loading users.</div>;
  }

  return (
    <Table<LoginHistoryUserRow>
      data={sortedUsers}
      columns={LoginHistoryColumns()}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No users available."
      noResultsFoundMessage="No results match your search"
    />
  );
};
