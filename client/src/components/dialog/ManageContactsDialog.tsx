import React, { ChangeEvent, useEffect, useMemo, useState } from "react";

import { Button, CircleButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { DeleteIcon, SearchIcon } from "components/icons";
import { Select } from "components/input/select/Select";
import { Table } from "components/table/Table";
import { useToast } from "components/toast";
import { ConfirmationToast } from "components/toast/ConfirmationToast";
import Switch from "react-switch";

import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { createColumnHelper, Table as TanstackTable } from "@tanstack/react-table";

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

const contactsColumnHelper = createColumnHelper<ContactRow>();

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
      const primariesOfType = contactsOfType.filter((c) => c.isPrimary);
      return primariesOfType.length <= 1;
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

  const handleClose = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const renderPagination = (table: TanstackTable<ContactRow>) => {
    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();
    const pageSize = table.getState().pagination.pageSize;
    const totalRows = selectedContacts.length;

    if (pageCount <= 1 || totalRows === 0) return null;
    const startRow = pageIndex * pageSize + 1;
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing {startRow} to {endRow} of {totalRows} contacts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value={totalRows}>All</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              First
            </button>
            <button
              type="button"
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {pageIndex + 1} of {pageCount}
            </span>

            <button
              type="button"
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
            <button
              type="button"
              className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    );
  };

  const columns = useMemo(
    () => [
      contactsColumnHelper.accessor("name", {
        header: "Name",
        size: 180, // 18%
        cell: (info) => <div className="whitespace-pre-line text-sm">{info.getValue()}</div>,
      }),
      contactsColumnHelper.accessor("email", {
        header: "Email",
        size: 320, // 32%
        cell: (info) => (
          <div className="truncate text-gray-700 text-sm" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      }),
      contactsColumnHelper.accessor("contactType", {
        header: "Contact Type",
        size: 320, // 32%
        cell: (info) => {
          const contact = info.row.original;
          const rowIndex = info.row.index;
          return (
            <div className="w-full">
              <Select
                id={`contact-type-${rowIndex}`}
                value={contact.contactType}
                options={getFilteredContactTypeOptions(contact.idmRoles)}
                placeholder="Select Type…"
                onSelect={(v) => handleContactTypeChange(contact.personId, v as ContactType)}
                isRequired
              />
            </div>
          );
        },
      }),
      contactsColumnHelper.accessor("isPrimary", {
        header: "Primary",
        size: 100, // 10%
        cell: (info) => {
          const contact = info.row.original;
          return (
            <div className="inline-flex items-center justify-center">
              <Switch
                checked={!!contact.isPrimary}
                onChange={() => handlePrimaryToggle(contact.personId)}
                onColor="#6B7280" // Dark grey when enabled
                offColor="#E5E7EB" // Light grey when disabled
                checkedIcon={false}
                uncheckedIcon={false}
                height={18}
                width={40}
                handleDiameter={24}
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
                activeBoxShadow="0 0 2px 3px #3bf"
              />
            </div>
          );
        },
      }),
      contactsColumnHelper.display({
        id: "actions",
        header: "",
        size: 80, // 8%
        cell: (info) => {
          const contact = info.row.original;
          return (
            <div className="text-center">
              <CircleButton
                name="Delete Contact"
                size="small"
                onClick={() => handleRemoveContact(contact.personId)}
                disabled={
                  contact.contactType === "Project Officer" &&
                  contact.isPrimary &&
                  selectedContacts.filter((c) => c.contactType === "Project Officer").length === 1
                }
              >
                <DeleteIcon />
              </CircleButton>
            </div>
          );
        },
      }),
    ],
    [
      selectedContacts,
      getFilteredContactTypeOptions,
      handleContactTypeChange,
      handlePrimaryToggle,
      handleRemoveContact,
    ]
  );

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
              <Table
                data={selectedContacts}
                columns={columns}
                emptyRowsMessage="No contacts assigned yet. Use search above to add contacts."
                initialState={{
                  sorting: [{ id: "name", desc: false }],
                  pagination: {
                    pageIndex: 0,
                    pageSize: 10,
                  },
                }}
                hideSearchAndActions={true}
                pagination={renderPagination}
              />
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
