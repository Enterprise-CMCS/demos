import React, { ChangeEvent, useEffect, useMemo, useState } from "react";

import { Button, CircleButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon, SearchIcon, SortIcon } from "components/icons";
import { Select } from "components/input/select/Select";
import { useToast } from "components/toast";
import { ConfirmationToast } from "components/toast/ConfirmationToast";

import { gql, useLazyQuery, useMutation } from "@apollo/client";

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

const UNSET_DEMONSTRATION_ROLES_MUTATION = gql`
  mutation UnsetDemonstrationRoles($input: [UnsetDemonstrationRoleInput!]!) {
    unsetDemonstrationRoles(input: $input) {
      role
    }
  }
`;

const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      status
      currentPhaseName
      amendments {
        id
        name
        effectiveDate
        status
      }
      extensions {
        id
        name
        effectiveDate
        status
      }
      documents {
        id
        name
        description
        documentType
        phaseName
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
      roles {
        role
        isPrimary
        person {
          id
          fullName
          email
        }
      }
    }
  }
`;

const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      state {
        id
        name
      }
      roles {
        isPrimary
        role
        person {
          id
          fullName
        }
      }
    }
  }
`;

const DEMONSTRATION_HEADER_DETAILS_QUERY = gql`
  query DemonstrationHeaderDetails($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      name
      expirationDate
      effectiveDate
      status
      state {
        id
      }
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;

export const CONTACT_TYPES = ["DDME Analyst", "Project Officer", "State Point of Contact"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

const CONTACT_TYPE_OPTIONS = CONTACT_TYPES.map((v) => ({ label: v, value: v }));

type PersonSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personType: string;
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
  idmRoles?: string[];
  contactType?: ContactType;
  isPrimary?: boolean;
};

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timeout);
  }, [value, ms]);

  return debounced;
}

const SortHeader = ({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "center";
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="whitespace-nowrap">{label}</span>
      {!active ? (
        <span className="text-gray-400">
          <SortIcon aria-hidden />
        </span>
      ) : dir === "asc" ? (
        <span className="text-gray-700">
          <ChevronUpIcon aria-hidden />
        </span>
      ) : (
        <span className="text-gray-700">
          <ChevronDownIcon aria-hidden />
        </span>
      )}
    </button>
  );
};

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
      "relative inline-flex h-[22px] w-[40px] items-center rounded-full",
      "transition-colors duration-150 ease-out",
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      checked ? "bg-[#6B7280]" : "bg-[#E5E7EB]",
      "ring-1 ring-inset ring-[#D1D5DB]",
    ].join(" ")}
  >
    <span
      className={[
        "h-[18px] w-[18px] rounded-full bg-white shadow-sm transform transition-transform duration-150 ease-out",
        checked ? "translate-x-[18px]" : "translate-x-[4px]",
      ].join(" ")}
    />
  </button>
);

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
      contactType: c.role as ContactType,
      isPrimary: c.isPrimary,
    }))
  );
  const [savedContacts, setSavedContacts] = useState<ContactRow[]>(
    existingContacts.map((c) => ({
      id: c.id,
      personId: c.person.id,
      name: c.person.fullName,
      email: c.person.email,
      idmRoles: c.person.idmRoles ?? [],
      contactType: c.role as ContactType,
      isPrimary: c.isPrimary,
    }))
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchPeople] = useLazyQuery(SEARCH_PEOPLE_QUERY, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => setSearchResults(data.searchPeople || []),
  });
  const [setDemonstrationRoles] = useMutation(SET_DEMONSTRATION_ROLE_MUTATION, {
    refetchQueries: [
      { query: DEMONSTRATION_DETAIL_QUERY, variables: { id: demonstrationId } },
      { query: GET_DEMONSTRATION_BY_ID_QUERY, variables: { id: demonstrationId } },
      { query: DEMONSTRATION_HEADER_DETAILS_QUERY, variables: { demonstrationId } },
    ],
  });

  const [unsetDemonstrationRoles] = useMutation(UNSET_DEMONSTRATION_ROLES_MUTATION, {
    refetchQueries: [
      { query: DEMONSTRATION_DETAIL_QUERY, variables: { id: demonstrationId } },
      { query: GET_DEMONSTRATION_BY_ID_QUERY, variables: { id: demonstrationId } },
      { query: DEMONSTRATION_HEADER_DETAILS_QUERY, variables: { demonstrationId } },
    ],
  });

  const optionsByRole = useMemo(
    () => ({
      CMS: CONTACT_TYPE_OPTIONS.filter((o) => o.value !== "State Point of Contact"),
      State: CONTACT_TYPE_OPTIONS.filter((o) => o.value === "State Point of Contact"),
      Default: CONTACT_TYPE_OPTIONS,
    }),
    []
  );

  const getFilteredContactTypeOptions = (idmRoles?: string[]) => {
    const roles = idmRoles ?? [];
    if (roles.includes("CMS")) return optionsByRole.CMS;
    if (roles.includes("State")) return optionsByRole.State;
    return optionsByRole.Default;
  };

  const debouncedSearchTerm = useDebounced(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      searchPeople({ variables: { search: debouncedSearchTerm } });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchPeople]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleAddContact = (person: PersonSearchResult) => {
    if (selectedContacts.some((c) => c.personId === person.id)) return;

    setSelectedContacts((prev) => {
      const existingProjectOfficers = prev.filter((c) => c.contactType === "Project Officer");

      let defaults: { contactType?: ContactType; isPrimary: boolean };

      if (person.personType === "State") {
        defaults = {
          contactType: "State Point of Contact" as ContactType,
          isPrimary: false,
        };
      } else {
        if (existingProjectOfficers.length === 0) {
          defaults = { contactType: "Project Officer" as ContactType, isPrimary: true };
        } else {
          defaults = { isPrimary: false };
        }
      }

      return [
        ...prev,
        {
          personId: person.id,
          name: `${person.firstName} ${person.lastName}`,
          email: person.email,
          idmRoles: [person.personType],
          ...defaults,
        },
      ];
    });

    setSearchResults([]);
    setSearchTerm("");
  };

  const handleContactTypeChange = (personId: string, value: ContactType) => {
    const updated = [...selectedContacts];
    const contactIndex = updated.findIndex((c) => c.personId === personId);
    if (contactIndex === -1) return;

    const contact = updated[contactIndex];
    const oldType = contact.contactType;
    const wasPrimary = contact.isPrimary;

    contact.contactType = value;

    if (value === "Project Officer") {
      contact.isPrimary = true;

      updated.forEach((c) => {
        if (c.contactType === "Project Officer" && c.personId !== personId) {
          c.contactType = undefined;
          c.isPrimary = false;
        }
      });
    } else {
      contact.isPrimary = false;
    }

    if (wasPrimary && oldType && oldType !== value) {
      const remainingOfOldType = updated.filter((c) => c.contactType === oldType);
      if (remainingOfOldType.length > 0) {
        remainingOfOldType[0].isPrimary = true;
      }
    }

    setSelectedContacts(updated);
  };

  const handlePrimaryToggle = (personId: string) => {
    const updated = [...selectedContacts];
    const contactIndex = updated.findIndex((c) => c.personId === personId);
    if (contactIndex === -1) return;

    const contact = updated[contactIndex];
    const type = contact.contactType;
    if (!type) return;

    if (type === "Project Officer" && contact.isPrimary) {
      const projectOfficers = updated.filter((c) => c.contactType === "Project Officer");
      if (projectOfficers.length === 1) {
        return;
      }
    }

    updated.forEach((c) => {
      if (c.contactType === type && c.personId !== contact.personId) c.isPrimary = false;
    });
    contact.isPrimary = !contact.isPrimary;
    setSelectedContacts(updated);
  };

  const handleRemoveContact = (personId: string) => {
    const contactToRemove = selectedContacts.find((c) => c.personId === personId);
    if (!contactToRemove) return;

    setContactToDelete(personId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    const contactToRemove = selectedContacts.find((c) => c.personId === contactToDelete);
    if (!contactToRemove || !contactToRemove.contactType) return;

    const updated = selectedContacts.filter((c) => c.personId !== contactToDelete);

    if (contactToRemove.isPrimary && contactToRemove.contactType) {
      const remainingOfSameType = updated.filter(
        (c) => c.contactType === contactToRemove.contactType
      );
      if (remainingOfSameType.length > 0) {
        remainingOfSameType[0].isPrimary = true;
      }
    }

    setSelectedContacts(updated);
    setShowDeleteConfirm(false);
    setContactToDelete(null);

    try {
      await unsetDemonstrationRoles({
        variables: {
          input: [
            {
              demonstrationId,
              personId: contactToRemove.personId,
              roleId: contactToRemove.contactType,
            },
          ],
        },
      });
      setSavedContacts(updated);
    } catch (e) {
      console.error(e);
      setSelectedContacts(selectedContacts);
      showError("Failed to remove contact. Please try again.");
    }
  };

  const allValid = useMemo(() => {
    if (selectedContacts.length === 0) return false;

    if (!selectedContacts.every((c) => !!c.contactType)) return false;

    const projectOfficers = selectedContacts.filter((c) => c.contactType === "Project Officer");
    if (projectOfficers.length !== 1 || !projectOfficers[0].isPrimary) return false;

    const presentTypes = Array.from(
      new Set(selectedContacts.map((c) => c.contactType).filter(Boolean) as string[])
    ).filter((type) => type !== "Project Officer");

    return presentTypes.every((type) => {
      const contactsOfType = selectedContacts.filter((c) => c.contactType === type);
      if (contactsOfType.length === 1) {
        return true;
      } else {
        const primariesOfType = contactsOfType.filter((c) => c.isPrimary);
        return primariesOfType.length === 1;
      }
    });
  }, [selectedContacts]);

  const hasChanges = useMemo(() => {
    type ContactComparison = { personId: string; contactType?: ContactType; isPrimary?: boolean };

    const normalize = (arr: ContactComparison[]) =>
      [...arr]
        .sort((a, b) => a.personId.localeCompare(b.personId))
        .map(({ personId, contactType, isPrimary }) => ({ personId, contactType, isPrimary }));

    const savedForComparison: ContactComparison[] = savedContacts.map((c) => ({
      personId: c.personId,
      contactType: c.contactType,
      isPrimary: c.isPrimary,
    }));

    return (
      JSON.stringify(normalize(selectedContacts)) !== JSON.stringify(normalize(savedForComparison))
    );
  }, [selectedContacts, savedContacts]);

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
      setSavedContacts([...selectedContacts]);
      showSuccess("Contacts updated successfully.");
      onClose();
    } catch (e) {
      console.error(e);
      showError("An error occurred while updating contacts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  type SortKey = "name" | "email" | "contactType" | "isPrimary";
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...selectedContacts];
    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av =
        sortKey === "isPrimary" ? (a.isPrimary ? 1 : 0) : String(a[sortKey] ?? "").toLowerCase();
      const bv =
        sortKey === "isPrimary" ? (b.isPrimary ? 1 : 0) : String(b[sortKey] ?? "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [selectedContacts, sortKey, sortDir]);

  const handleClose = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <BaseDialog
        title="Manage Contact(s)"
        isOpen={isOpen}
        onClose={handleClose}
        showCancelConfirm={showCancelConfirm}
        setShowCancelConfirm={setShowCancelConfirm}
        maxWidthClass="max-w-[1000px]"
        actions={
          <>
            <SecondaryButton name="button-cancel" size="small" onClick={handleClose}>
              Cancel
            </SecondaryButton>
            <Button
              name="button-save"
              size="small"
              onClick={handleSubmit}
              disabled={!allValid || !hasChanges || isSubmitting}
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
            <div className="relative">
              <SearchIcon className="absolute top-1/2 -translate-y-1/2 text-gray-400 h-[18px] w-[18px] pointer-events-none ml-[10px]" />
              <input
                name="search"
                type="text"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              />
            </div>
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
              <table className="w-full min-w-[900px] text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "32%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>

                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-2 py-2 font-bold text-sm">
                      <SortHeader
                        label="Name"
                        active={sortKey === "name"}
                        dir={sortDir}
                        onClick={() => onSort("name")}
                      />
                    </th>
                    <th className="px-2 py-2 font-bold text-sm">
                      <SortHeader
                        label="Email"
                        active={sortKey === "email"}
                        dir={sortDir}
                        onClick={() => onSort("email")}
                      />
                    </th>
                    <th className="px-2 py-2 font-bold text-sm">
                      <SortHeader
                        label="Contact Type"
                        active={sortKey === "contactType"}
                        dir={sortDir}
                        onClick={() => onSort("contactType")}
                      />
                    </th>
                    <th className="px-2 py-2 font-bold text-sm text-center">
                      <SortHeader
                        label="Primary"
                        active={sortKey === "isPrimary"}
                        dir={sortDir}
                        onClick={() => onSort("isPrimary")}
                        align="center"
                      />
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {sorted.map((c, i) => (
                    <tr key={c.personId} className="bg-white">
                      <td className="px-2 py-1 align-middle">
                        <div className="whitespace-pre-line text-sm">{c.name}</div>
                      </td>
                      <td className="px-2 py-1 align-middle text-gray-700 text-sm min-w-0">
                        <div className="truncate" title={c.email}>
                          {c.email}
                        </div>
                      </td>
                      <td className="px-2 py-1 align-middle min-w-0">
                        <div className="w-full">
                          <Select
                            id={`contact-type-${i}`}
                            value={c.contactType}
                            options={getFilteredContactTypeOptions(c.idmRoles)}
                            placeholder="Select Type…"
                            onSelect={(v) => handleContactTypeChange(c.personId, v as ContactType)}
                            isRequired
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1 align-middle text-center">
                        <div className="inline-flex items-center justify-center">
                          <Toggle
                            checked={!!c.isPrimary}
                            onChange={() => handlePrimaryToggle(c.personId)}
                            name="primary"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1 align-middle text-center">
                        <CircleButton
                          name="Delete Contact"
                          size="small"
                          onClick={() => handleRemoveContact(c.personId)}
                          disabled={
                            c.contactType === "Project Officer" &&
                            c.isPrimary &&
                            selectedContacts.filter(
                              (contact) => contact.contactType === "Project Officer"
                            ).length === 1
                          }
                        >
                          <DeleteIcon />
                        </CircleButton>
                      </td>
                    </tr>
                  ))}

                  {sorted.length === 0 && (
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

      {showDeleteConfirm && contactToDelete && (
        <ConfirmationToast
          message={`Are you sure you want to remove ${selectedContacts.find((c) => c.personId === contactToDelete)?.name} from contacts?`}
          onConfirm={confirmDeleteContact}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setContactToDelete(null);
          }}
        />
      )}
    </>
  );
};
