import React, {
  ChangeEvent,
  useMemo,
  useState,
} from "react";

import {
  Button,
  CircleButton,
  SecondaryButton,
} from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DeleteIcon } from "components/icons";
import { Input } from "components/input/Input";
import { Select } from "components/input/select/Select";
import { useToast } from "components/toast";

import {
  gql,
  useLazyQuery,
  useMutation,
} from "@apollo/client";

// ───────────────── GraphQL ─────────────────
const SEARCH_PEOPLE_QUERY = gql`
  query SearchPeople($search: String!) {
    searchPeople(search: $search) {
      id
      firstName
      lastName
      email
      personType
    }
  }
`;

const SET_DEMONSTRATION_ROLE_MUTATION = gql`
  mutation SetDemonstrationRoles($input: [SetDemonstrationRoleInput!]!) {
    setDemonstrationRoles(input: $input) {
      role
    }
  }
`;

// ───────────────── Types/Constants ─────────────────
const CONTACT_TYPE_OPTIONS = [
  { label: "DDME Analyst", value: "DDME Analyst" },
  { label: "Project Officer", value: "Project Officer" },
  { label: "State Point of Contact", value: "State Point of Contact" },
];

type PersonSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personType: string; // "CMS" | "Admin" | "State"
};

export type ManageContactsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  demonstrationId: string;
  existingContacts?: {
    id?: string;
    person: { id: string; fullName: string; email: string; idmRoles?: string[] };
    role: string;
    isPrimary: boolean;
  }[];
};

type ContactRow = {
  id?: string;
  personId: string;
  name: string;
  email: string;
  idmRoles?: string[]; // IDM roles if known (affects allowed contact types)
  contactType?: string;
  isPrimary?: boolean;
};

// Small inline switch to match Figma
const Toggle = ({
  checked,
  onChange,
  disabled,
  name,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  name?: string;
}) => (
  <button
    type="button"
    name={name}
    aria-checked={checked}
    role="switch"
    onClick={() => !disabled && onChange()}
    className={[
      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      checked ? "bg-blue-600" : "bg-gray-300",
    ].join(" ")}
  >
    <span
      className={[
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-5" : "translate-x-1",
      ].join(" ")}
    />
  </button>
);

// ───────────────── Component ─────────────────
export const ManageContactsDialog: React.FC<ManageContactsDialogProps> = ({
  isOpen,
  onClose,
  demonstrationId,
  existingContacts = [],
}) => {
  const { showSuccess, showError } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ContactRow[]>(
    existingContacts.map((c) => ({
      id: c.id,
      personId: c.person.id,
      name: c.person.fullName,
      email: c.person.email,
      idmRoles: c.person.idmRoles ?? [],
      contactType: c.role,
      isPrimary: c.isPrimary,
    }))
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchPeople] = useLazyQuery(SEARCH_PEOPLE_QUERY, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => setSearchResults(data.searchPeople || []),
  });

  const [setDemonstrationRoles] = useMutation(SET_DEMONSTRATION_ROLE_MUTATION);

  // Allowed contact types per IDM role
  const filteredContactTypeOptions = (idmRoles?: string[]) => {
    const roles = idmRoles ?? [];
    if (roles.includes("CMS")) {
      return CONTACT_TYPE_OPTIONS.filter((o) => o.value !== "State Point of Contact");
    }
    if (roles.includes("State")) {
      return CONTACT_TYPE_OPTIONS.filter((o) => o.value === "State Point of Contact");
    }
    return CONTACT_TYPE_OPTIONS; // Admin/unknown → all
  };

  // ── handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) searchPeople({ variables: { search: value } });
    else setSearchResults([]);
  };

  const handleAddContact = (person: PersonSearchResult) => {
    if (selectedContacts.some((c) => c.personId === person.id)) return;

    const defaults =
      person.personType === "State"
        ? { contactType: "State Point of Contact", isPrimary: false }
        : { isPrimary: false };

    setSelectedContacts((prev) => [
      ...prev,
      {
        personId: person.id,
        name: `${person.firstName} ${person.lastName}`,
        email: person.email,
        idmRoles: [person.personType],
        ...defaults,
      },
    ]);
    setSearchResults([]);
    setSearchTerm("");
  };

  const handleContactTypeChange = (index: number, value: string) => {
    const updated = [...selectedContacts];
    updated[index].contactType = value;
    setSelectedContacts(updated);
  };

  const handlePrimaryToggle = (index: number) => {
    const updated = [...selectedContacts];
    const contact = updated[index];
    const type = contact.contactType;
    if (!type) return;

    // Ensure only one primary per contact type
    updated.forEach((c) => {
      if (c.contactType === type && c !== contact) c.isPrimary = false;
    });
    contact.isPrimary = !contact.isPrimary;
    setSelectedContacts(updated);
  };

  const handleRemoveContact = (index: number) => {
    const updated = [...selectedContacts];
    updated.splice(index, 1);
    setSelectedContacts(updated);
  };

  // Save enabled only when:
  //  - every row has a contactType
  //  - for each contactType present among rows, exactly one is primary
  const allValid = useMemo(() => {
    if (selectedContacts.length === 0) return false;
    if (!selectedContacts.every((c) => !!c.contactType)) return false;

    const presentTypes = Array.from(
      new Set(selectedContacts.map((c) => c.contactType).filter(Boolean) as string[])
    );
    return presentTypes.every((t) =>
      selectedContacts.some((c) => c.contactType === t && c.isPrimary)
    );
  }, [selectedContacts]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await setDemonstrationRoles({
        variables: {
          input: selectedContacts.map((c) => ({
            demonstrationId,
            personId: c.personId,
            roleId: c.contactType,
            isPrimary: !!c.isPrimary,
          })),
        },
      });
      showSuccess("Contacts updated successfully.");
      onClose();
    } catch (e) {
      console.error(e);
      showError("An error occurred while updating contacts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────────────── Render (Figma-accurate) ─────────────────
  return (
    <BaseDialog
      title="Manage Contact(s)"
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      maxWidthClass="max-w-[95vw]"
      actions={
        <>
          <SecondaryButton
            name="button-cancel"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-save"
            size="small"
            onClick={handleSubmit}
            disabled={!allValid || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <div className="mb-1 text-sm font-medium">
            <span className="text-red-600 mr-1">*</span> Search
          </div>
          <Input
            name="search"
            type="text"
            label=""
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 z-20 mt-2 border border-gray-200 rounded-md p-2 bg-white shadow-lg max-h-[200px] overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddContact(p)}
                  className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded"
                >
                  <div className="flex justify-between">
                    <span>{`${p.firstName} ${p.lastName}`}</span>
                    <span className="text-gray-600">{p.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 text-sm font-semibold">Assigned Contacts</div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-2 py-1.5 font-medium text-xs">Name</th>
                  <th className="px-2 py-1.5 font-medium text-xs">Email</th>
                  <th className="px-2 py-1.5 font-medium text-xs">Contact Type</th>
                  <th className="px-2 py-1.5 font-medium text-center text-xs">Primary</th>
                  <th className="px-2 py-1.5 font-medium text-center text-xs">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedContacts.map((c, i) => (
                  <tr key={c.personId} className="bg-white">
                    <td className="px-2 py-1.5 align-middle">
                      <div className="whitespace-pre-line text-sm">{c.name}</div>
                    </td>
                    <td className="px-2 py-1.5 align-middle text-gray-700 text-sm">{c.email}</td>
                    <td className="px-2 py-1.5 align-middle">
                      <div className="w-[200px]">
                        <Select
                          id={`contact-type-${i}`}
                          value={c.contactType}
                          options={filteredContactTypeOptions(c.idmRoles)}
                          placeholder="Select Type…"
                          onSelect={(v) => handleContactTypeChange(i, v)}
                          isRequired
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 align-middle text-center">
                      <Toggle
                        checked={!!c.isPrimary}
                        onChange={() => handlePrimaryToggle(i)}
                        name="primary"
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle text-center">
                      <CircleButton
                        name="Delete Contact"
                        size="small"
                        onClick={() => handleRemoveContact(i)}
                        disabled={c.isPrimary}
                      >
                        <DeleteIcon />
                      </CircleButton>
                    </td>
                  </tr>
                ))}
                {selectedContacts.length === 0 && (
                  <tr>
                    <td className="px-2 py-4 text-gray-500 text-sm text-center" colSpan={5}>
                      No contacts assigned yet. Use search above to add contacts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};
