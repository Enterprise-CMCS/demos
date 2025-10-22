import React from "react";
import { gql, useQuery /*, useMutation */ } from "@apollo/client";
import { ColumnDef } from "@tanstack/react-table";
import { Table } from "components/table/Table";
import { ToggleSwitch } from "components/switch/index";
import { ErrorToast } from "components/toast";
import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon } from "components/icons";
import { Select } from "components/input/select/Select";
import { useToast } from "components/toast";
import { ROLES } from "demos-server-constants";

type ContactRows = {
  id: string;
  fullName: string;
  email: string;
  contactType?: string | null; // shown in the Select
  isPrimary: boolean;          // shown in the Toggle
};

const FETCH_MANAGE_CONTACTS_QUERY = gql`
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
        demonstration { id }
        # roleName  <-- if you have it, you can use it for Contact Type
      }
      states { id }
    }
  }
`;

// ---- Example options; replace with your actual list or fetch from API
const CONTACT_TYPE_OPTIONS = ROLES.map(role => ({
  value: role.toUpperCase().replace(/[\s&]/g, "_"),
  label: role,
}));

type Role = {
  isPrimary: boolean;
  demonstration: { id: string };
  // roleName?: string;
};

type State = { id: string };

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

function useContacts(demonstrationId?: string) {
  const { data, loading, error } = useQuery(FETCH_MANAGE_CONTACTS_QUERY);

  const contacts: ContactRows[] =
    data?.people?.map((p: GQLContact) => {
      const roles = p.roles ?? [];
      const isPrimary =
        roles.some((r) =>
          demonstrationId ? r.demonstration?.id === demonstrationId && r.isPrimary : r.isPrimary
        ) ?? false;

      // pick some contact type; if you have a roleName per demo, use that; else fall back to personType
      const contactType: string | null = p.personType || null;

      return {
        id: p.id,
        fullName: p.fullName,
        email: p.email,
        contactType,
        isPrimary,
      };
    }) ?? [];

  return { contacts, loading, error };
}

type ManageContactsTableProps = {
  demonstrationId?: string;
  // Optional callbacks if you want to handle updates in parent:
  onChangePrimary?: (personId: string, next: boolean) => Promise<void> | void;
  onChangeContactType?: (personId: string, next: string) => Promise<void> | void;
  onRemove?: (personId: string) => Promise<void> | void;
};

export const ManageContactsTable: React.FC<ManageContactsTableProps> = ({
  demonstrationId,
  onChangePrimary,
  onChangeContactType,
  onRemove,
}) => {
  const { contacts, loading, error } = useContacts(demonstrationId);
  const { showSuccess, showError } = useToast();
  // const toast = useToast();
  const [reason, setReason] = React.useState("");
  const columns = React.useMemo<ColumnDef<ContactRows>[]>(() => {
    return [
      {
        accessorKey: "fullName",
        header: "Name",
        meta: { columnClassName: "w-[28%]" },
        cell: ({ getValue }) => <div className="text-[28px] leading-[40px]">{getValue<string>()}</div>, // big name like screenshot
      },
      {
        accessorKey: "email",
        header: "Email",
        meta: { columnClassName: "w-[30%]" },
        cell: ({ getValue }) => <div className="text-[28px] leading-[40px]">{getValue<string>()}</div>,
      },
      {
        id: "contactType",
        header: "Contact Type",
        meta: { columnClassName: "w-[26%]" },
        cell: ({ row }) => {
          const [local, setLocal] = React.useState<string>(row.original.contactType ?? "");
          const commit = async (next: string) => {
            setLocal(next);
            try {
              await onChangeContactType?.(row.original.id, next);
              // await mutateUpdateContactType(...)
            } catch (e) {
              showError("Failed to update contact type");
            }
          };
          return (
            <Select
              id="declare-incomplete-reason"
              isRequired
              options={CONTACT_TYPE_OPTIONS}
              value={reason}
              onSelect={(value) => setReason(value)}
            />
          );
        },
      },
      {
        id: "primary",
        header: "Primary",
        enableSorting: true,
        meta: { columnClassName: "w-[12%] text-center" },
        cell: ({ row }) => {
          const [local, setLocal] = React.useState<boolean>(row.original.isPrimary);
          const onToggle = async (next: boolean) => {
            setLocal(next); // optimistic
            try {
              await onChangePrimary?.(row.original.id, next);
              // await mutateUpdatePrimary({ variables: { personId: row.original.id, demoId: demonstrationId, isPrimary: next } });
            } catch (e) {
              setLocal(!next); // revert
              // toast.error("Failed to update primary flag");
            }
          };
          return (
            <div className="flex justify-center">
              <ToggleSwitch
                checked={local}
                onChange={onToggle}
                ariaLabel={`Toggle primary for ${row.original.fullName}`}
              />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        meta: { columnClassName: "w-[4%] text-right" },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <CircleButton
              key="circle-trash"
              size="large"
              name="test-circle-button-trash"
              aria-label={`Remove ${row.original.fullName}`}
              onClick={() => onRemove?.(row.original.id)}
            >
              <DeleteIcon />
            </CircleButton>
          </div>
        ),
      },
    ];
  }, [demonstrationId, onChangePrimary, onChangeContactType, onRemove]);

  if (loading) return <div>Loading contacts…</div>;
  if (error) return <div>Unable to load contacts.</div>;

  return (
    <div className="[&>table]:w-auto [&>table]:table-auto inline-block">
      <Table<ContactRows>
        data={contacts}
        columns={columns}
        emptyRowsMessage="No contacts found."
      />
    </div>
  );
};
