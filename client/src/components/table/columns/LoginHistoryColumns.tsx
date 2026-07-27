import { createColumnHelper } from "@tanstack/react-table";
import { Person, User } from "demos-server";
import { formatDate } from "date-fns";
import { highlightCell } from "../KeywordSearch";

export type LoginHistoryUserRow = Pick<User, "id" | "lastLogin" | "username"> & {
  person: Pick<Person, "id" | "fullName" | "email">
};

export const getLastLogin = (user: LoginHistoryUserRow): string =>
  user.lastLogin ? formatDate(user.lastLogin, "MM/dd/yyyy hh:mm:ssa") : "-";

const columnHelper = createColumnHelper<LoginHistoryUserRow>();

export const LoginHistoryColumns = () => [
  columnHelper.accessor((user) => user.person.fullName, {
    id: "name",
    header: "Name",
    enableSorting: false,
    cell: highlightCell,
  }),
  columnHelper.accessor((user) => user.username, {
    id: "username",
    header: "Username",
    enableSorting: false,
    cell: highlightCell,
  }),
  columnHelper.accessor((user) => user.person.email, {
    id: "email",
    header: "Email",
    enableSorting: false,
    cell: highlightCell,
  }),
  columnHelper.accessor(getLastLogin, {
    id: "lastLogin",
    header: "Last Login",
    cell: highlightCell,
  }),
];
