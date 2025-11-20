import React from "react";
import {
  DemonstrationRoleAssignment as ServerDemonstrationRoleAssignment,
  Person,
} from "demos-server";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { gql, useQuery } from "@apollo/client";
import { createColumnHelper } from "@tanstack/react-table";

export type DemonstrationRoleAssignment = Pick<
  ServerDemonstrationRoleAssignment,
  "role" | "isPrimary"
> & {
  person: Pick<Person, "id" | "fullName" | "email">;
};
export const CONTACTS_TABLE_QUERY = gql`
  query ContactsTable($id: ID!) {
    demonstration(id: $id) {
      roles {
        isPrimary
        role
        person {
          id
          fullName
          email
        }
      }
    }
  }
`;

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

export const ContactsTable: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { data, loading, error } = useQuery<{
    demonstration: { roles: DemonstrationRoleAssignment[] };
  }>(CONTACTS_TABLE_QUERY, {
    variables: { id: demonstrationId },
  });
  if (loading) {
    return <div>Loading contacts...</div>;
  }
  const demonstration = data?.demonstration;
  if (error || !demonstration) {
    return <div>Error loading contacts.</div>;
  }

  return (
    <Table<DemonstrationRoleAssignment>
      data={demonstration.roles}
      columns={contactsColumns}
      pagination={(table) => <PaginationControls table={table} />}
    />
  );
};
