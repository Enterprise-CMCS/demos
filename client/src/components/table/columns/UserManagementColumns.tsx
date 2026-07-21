import { createColumnHelper, SortingFn } from "@tanstack/react-table";
import { Person, State, User, UserType } from "demos-server";
import { formatDateForDisplay } from "util/formatDate";
import { highlightCell } from "../KeywordSearch";

const ALL_STATES = "All States";

const IDM_USER_ROLE_LABELS: Record<UserType, string> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
};

// Narrowed to UserType: user_person_type_limit rules out non-user-contact.
export type ManagedUser = Pick<User, "id" | "lastLogin"> & {
  person: Pick<Person, "id" | "fullName" | "email"> & {
    personType: UserType;
    states: Pick<State, "id" | "name">[];
  };
};

// Only state users can hold states; enforced server-side by checkPersonIsStateUser.
export const isUnassigned = (user: ManagedUser): boolean =>
  user.person.personType === "demos-state-user" && user.person.states.length === 0;

export const getAssignedStates = (user: ManagedUser): string => {
  if (user.person.personType !== "demos-state-user") {
    return ALL_STATES;
  }
  if (isUnassigned(user)) {
    return "-";
  }
  return user.person.states
    .map((state) => state.name)
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
};

export const getLastLogin = (user: ManagedUser): string =>
  user.lastLogin ? formatDateForDisplay(user.lastLogin) : "-";

// Accessor returns MM/DD/YYYY so search matches the screen; sort on the raw timestamp.
const sortByLastLoginDate: SortingFn<ManagedUser> = (rowA, rowB) => {
  const toTime = (user: ManagedUser) => (user.lastLogin ? new Date(user.lastLogin).getTime() : 0);
  return toTime(rowA.original) - toTime(rowB.original);
};

const columnHelper = createColumnHelper<ManagedUser>();

export const UserManagementColumns = () => [
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
