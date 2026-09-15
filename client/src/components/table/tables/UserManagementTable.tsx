import React from "react";
import { gql, useQuery } from "@apollo/client";
import { CircleButton } from "components/button/CircleButton";
import { useDialog } from "components/dialog/DialogContext";
import { EditIcon } from "components/icons";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { isUnassigned, ManagedUser, UserManagementColumns } from "../columns/UserManagementColumns";

export const USER_MANAGEMENT_QUERY_NAME = "GetUsersForUserManagement";
export const EDIT_STATES_ENABLED_TOOLTIP = "Edit";
export const EDIT_STATES_DISABLED_TOOLTIP = "Select a State User to Edit";

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

// Only State users hold explicit assignments; CMS and Admin users implicitly get every State.
const isStateUser = (user: ManagedUser): boolean =>
  user.person.personType === "demos-state-user";

export const UserManagementTable: React.FC = () => {
  const { showAssignStatesDialog } = useDialog();
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
      keywordSearch={(table) => <KeywordSearch table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No users available."
      noResultsFoundMessage="No results match your search"
      actionButtons={(table) => {
        const selected = table.getSelectedRowModel().rows.map((row) => row.original);
        const canEdit = selected.length === 1 && isStateUser(selected[0]);

        return (
          <div className="flex gap-1 ml-4">
            <CircleButton
              name="edit-user-states"
              aria-label="Edit State Assignments"
              tooltip={canEdit ? EDIT_STATES_ENABLED_TOOLTIP : EDIT_STATES_DISABLED_TOOLTIP}
              disabled={!canEdit}
              onClick={() => canEdit && showAssignStatesDialog(selected[0].person)}
            >
              <EditIcon />
            </CircleButton>
          </div>
        );
      }}
    />
  );
};
