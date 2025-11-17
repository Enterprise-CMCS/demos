import React from "react";

import {
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
  Person,
} from "demos-server";

import { createColumnHelper } from "@tanstack/react-table";

import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";

export type DemonstrationRoleAssignment = Pick<
  ServerDemonstrationRoleAssignment,
  "role" | "isPrimary"
> & {
  person: Pick<Person, "id" | "fullName" | "email">;
};

const contactsColumnHelper = createColumnHelper<DemonstrationRoleAssignment>();
const contactsColumns = [
  contactsColumnHelper.accessor("person.fullName", {
    id: "fullName",
    header: "Name",
  }),
  contactsColumnHelper.accessor("person.email", {
    id: "email",
    header: "Email",
    sortingFn: "alphanumeric",
  }),
  contactsColumnHelper.accessor("role", {
    id: "contactType",
    header: "Contact Type",
  }),
  contactsColumnHelper.accessor("isPrimary", {
    id: "isPrimary",
    header: "Primary",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
];

type ContactsTableProps = {
  roles: DemonstrationRoleAssignment[];
};

export const ContactsTable: React.FC<ContactsTableProps> = ({ roles = [] }) => (
  <Table<DemonstrationRoleAssignment>
    data={roles}
    columns={contactsColumns}
    pagination={(table) => <PaginationControls table={table} />}
  />
);
