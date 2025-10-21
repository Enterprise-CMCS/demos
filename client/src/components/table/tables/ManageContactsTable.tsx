import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";

type Contact = {
  id: number;
  name: string;
  email: string;
};

const CONTACTS_QUERY = gql`
  query Contacts {
    people {
      id
      fullName
      email
      firstName
      lastName
      personType
      createdAt
      roles {
        isPrimary
        demonstration {
          id
        }
      }
      states {
        id
      }
    }
  }
`;

type Role = {
  isPrimary: boolean;
  demonstration: {
    id: string;
  };
};

type State = {
  id: string;
};

type GQLContact = {
  id: string;
  fullName: string;
  email: string;
  firstName: string;
  lastName: string;
  personType: string;
  createdAt: string;
  roles: Role[];
  states: State[];
};

function useContacts() {
  const { data, loading, error } = useQuery(CONTACTS_QUERY);
  const contacts: Contact[] =
    data?.people?.map((person: GQLContact) => ({
      id: person.id,
      name: person.fullName,
      email: person.email,
    })) ?? [];

  return { contacts, loading, error };
}

const data: Contact[] = [
  { id: 1, name: "Alice Smith", email: "alice@example.com" },
  { id: 2, name: "Bob Jones", email: "bob@example.com" },
];

const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: "id",
    header: () => "ID",
  },
  {
    accessorKey: "name",
    header: () => "Name",
  },
  {
    accessorKey: "email",
    header: () => "Email",
  },
];

export const ManageContactsTable: React.FC = () => {
  const { contacts, loading, error } = useContacts();
  const tableData = contacts.length ? contacts : data;

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <div>Loading contacts…</div>;
  }

  if (error) {
    return <div>Unable to load contacts.</div>;
  }

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageContactsTable;
