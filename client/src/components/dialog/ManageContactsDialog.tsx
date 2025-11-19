import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { SearchIcon, WarningIcon } from "components/icons";
import { Table } from "components/table/Table";
import { useToast } from "components/toast";
import { ConfirmationToast } from "components/toast/ConfirmationToast";
import type { DemonstrationRoleAssignment, Person } from "demos-server";
import {
  ADMIN_DEMONSTRATION_ROLES,
  CMS_USER_DEMONSTRATION_ROLES,
  STATE_USER_DEMONSTRATION_ROLES,
} from "demos-server-constants";
import { useDebounced } from "hooks/useDebounced";
import {
  DEMONSTRATION_DETAIL_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
} from "pages/DemonstrationDetail/DemonstrationDetail";

import { gql, useLazyQuery, useMutation } from "@apollo/client";

import type { ContactRow, ContactType } from "../table/columns/ContactColumns";
import { ContactColumns } from "../table/columns/ContactColumns";
import { PaginationControls } from "../table/PaginationControls";

const SEARCH_PEOPLE_QUERY = gql`
  query SearchPeople($search: String!, $demonstrationId: ID) {
    searchPeople(search: $search, demonstrationId: $demonstrationId) {
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

type PersonSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  personType: string;
};

export type ExistingContactType = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  id?: string;
  person: Pick<Person, "id" | "fullName" | "email"> & {
    idmRoles?: string[];
  };
};

export type ManageContactsDialogProps = {
  onClose: () => void;
  demonstrationId: string;
  existingContacts?: ExistingContactType[];
};

const mapExistingContacts = (arr: ManageContactsDialogProps["existingContacts"] = []) =>
  arr.map((contact) => ({
    id: contact.id,
    personId: contact.person.id,
    name: contact.person.fullName,
    email: contact.person.email,
    idmRoles: contact.person.idmRoles ?? [],
    contactType: contact.role satisfies ContactType,
    isPrimary: contact.isPrimary,
  }));

export const ManageContactsDialog: React.FC<ManageContactsDialogProps> = ({
  onClose,
  demonstrationId,
  existingContacts = [],
}) => {
  const { showSuccess, showError } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PersonSearchResult[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ContactRow[]>(
    mapExistingContacts(existingContacts)
  );
  const [savedContacts, setSavedContacts] = useState<ContactRow[]>(
    mapExistingContacts(existingContacts)
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrimaryWarning, setShowPrimaryWarning] = useState(false);

  const [searchPeople] = useLazyQuery(SEARCH_PEOPLE_QUERY, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      const results = data.searchPeople || [];
      setSearchResults(results);
    },
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
      "demos-cms-user": CMS_USER_DEMONSTRATION_ROLES.map((role) => ({ label: role, value: role })),
      "demos-state-user": STATE_USER_DEMONSTRATION_ROLES.map((role) => ({
        label: role,
        value: role,
      })),
      "demos-admin": ADMIN_DEMONSTRATION_ROLES.map((role) => ({ label: role, value: role })),
      Default: ADMIN_DEMONSTRATION_ROLES.map((role) => ({ label: role, value: role })),
    }),
    []
  );

  const getFilteredContactTypeOptions = (idmRoles?: string[]) => {
    const roles = idmRoles ?? [];
    if (roles.includes("demos-cms-user")) return optionsByRole["demos-cms-user"];
    if (roles.includes("demos-state-user")) return optionsByRole["demos-state-user"];
    if (roles.includes("demos-admin")) return optionsByRole["demos-admin"];
    return optionsByRole.Default;
  };

  const debouncedSearchTerm = useDebounced(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      searchPeople({
        variables: {
          search: debouncedSearchTerm,
          demonstrationId: demonstrationId,
        },
      });
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, searchPeople, demonstrationId]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleAddContact = (person: PersonSearchResult) => {
    if (selectedContacts.some((c) => c.personId === person.id)) return;

    setSelectedContacts((prev) => {
      const idmRoles = [person.personType];

      let defaults: { contactType?: ContactType; isPrimary: boolean };

      const availableTypes = getFilteredContactTypeOptions(idmRoles);

      if (person.personType === "demos-state-user") {
        const stateContactType: ContactType = "State Point of Contact";
        defaults = {
          contactType: stateContactType,
          isPrimary: false,
        };
      } else if (person.personType === "demos-cms-user") {
        const nonStateOptions = availableTypes.filter(
          (opt) => opt.value !== "State Point of Contact"
        );
        const defaultContactType =
          nonStateOptions.length > 0 ? (nonStateOptions[0].value as ContactType) : undefined;
        defaults = {
          contactType: defaultContactType,
          isPrimary: false,
        };
      } else {
        defaults = { isPrimary: false };
      }

      return [
        ...prev,
        {
          personId: person.id,
          name: `${person.firstName} ${person.lastName}`,
          email: person.email,
          idmRoles: idmRoles,
          ...defaults,
        },
      ];
    });

    setSearchResults([]);
    setSearchTerm("");
  };

  const handleContactTypeChange = useCallback((personId: string, newType?: ContactType) => {
    setSelectedContacts((previousContacts) => {
      const existingPrimaryProjectOfficers = previousContacts.filter(
        (c) => c.contactType === "Project Officer" && c.isPrimary && c.personId !== personId
      );

      return previousContacts.map((contact) => {
        if (contact.personId === personId) {
          let newIsPrimary = false;

          if (newType === "Project Officer") {
            newIsPrimary = existingPrimaryProjectOfficers.length === 0;
          } else if (newType === contact.contactType) {
            newIsPrimary = contact.isPrimary ?? false;
          } else {
            newIsPrimary = false;
          }

          return { ...contact, contactType: newType, isPrimary: newIsPrimary };
        }

        return contact;
      });
    });
  }, []);

  const handlePrimaryToggle = useCallback((personId: string) => {
    setSelectedContacts((prev) => {
      const target = prev.find((c) => c.personId === personId);
      if (!target || !target.contactType) return prev;

      const type = target.contactType;
      const existingPrimary = prev.find(
        (c) => c.contactType === type && c.isPrimary && c.personId !== personId
      );

      if (type === "Project Officer") {
        const projectOfficers = prev.filter((c) => c.contactType === "Project Officer");
        const primaryProjectOfficers = projectOfficers.filter((c) => c.isPrimary);

        if (target.isPrimary && primaryProjectOfficers.length === 1) {
          return prev;
        }

        if (!target.isPrimary && existingPrimary) {
          setShowPrimaryWarning(true);
          setTimeout(() => setShowPrimaryWarning(false), 3000);
        }

        return prev.map((contact) => {
          if (contact.contactType === "Project Officer") {
            return { ...contact, isPrimary: contact.personId === personId };
          }
          return contact;
        });
      } else {
        if (!target.isPrimary && existingPrimary) {
          setShowPrimaryWarning(true);
          setTimeout(() => setShowPrimaryWarning(false), 3000);
        }

        const willBePrimary = !target.isPrimary;
        return prev.map((contact) => {
          if (contact.personId === personId) {
            return { ...contact, isPrimary: willBePrimary };
          }
          if (contact.contactType === type) {
            return { ...contact, isPrimary: false };
          }
          return contact;
        });
      }
    });
  }, []);

  const handleRemoveContact = useCallback(
    (personId: string) => {
      const contactToRemove = selectedContacts.find((c) => c.personId === personId);
      if (!contactToRemove) return;

      setContactToDelete(personId);
      setShowDeleteConfirm(true);
    },
    [selectedContacts]
  );

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    const contactToRemove = selectedContacts.find((c) => c.personId === contactToDelete);
    if (!contactToRemove) return;

    const updated = selectedContacts.filter((c) => c.personId !== contactToDelete);

    let finalUpdated = updated;
    if (contactToRemove.isPrimary && contactToRemove.contactType) {
      const remainingOfSameType = updated.filter(
        (c) => c.contactType === contactToRemove.contactType
      );
      if (remainingOfSameType.length > 0) {
        finalUpdated = updated.map((c) => {
          if (c.personId === remainingOfSameType[0].personId) {
            return { ...c, isPrimary: true };
          }
          return c;
        });
      }
    }

    setSelectedContacts(finalUpdated);
    setShowDeleteConfirm(false);
    setContactToDelete(null);

    if (!contactToRemove.contactType) {
      const updatedSavedContacts = savedContacts.filter(
        (c) => c.personId !== contactToRemove.personId
      );
      setSavedContacts(updatedSavedContacts);
      return;
    }

    const contactExistsInDatabase = savedContacts.some(
      (c) =>
        c.personId === contactToRemove.personId && c.contactType === contactToRemove.contactType
    );

    if (contactExistsInDatabase) {
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
        setSavedContacts(finalUpdated.map((c) => ({ ...c })));
      } catch (e) {
        console.error(e);
        setSelectedContacts(selectedContacts);
        showError("Failed to remove contact. Please try again.");
      }
    } else {
      const updatedSavedContacts = savedContacts.filter(
        (c) => c.personId !== contactToRemove.personId
      );
      setSavedContacts(updatedSavedContacts);
    }
  };

  const allValid = useMemo(() => {
    if (selectedContacts.length === 0) {
      return false;
    }

    if (!selectedContacts.every((c) => !!c.contactType)) {
      return false;
    }

    const projectOfficers = selectedContacts.filter((c) => c.contactType === "Project Officer");
    if (projectOfficers.length === 0) {
      return false;
    }

    const primaryProjectOfficers = projectOfficers.filter((c) => c.isPrimary);
    if (primaryProjectOfficers.length !== 1) {
      return false;
    }

    const presentTypes = Array.from(
      new Set(
        selectedContacts
          .map((contact) => contact.contactType)
          .filter((type): type is ContactType => Boolean(type))
      )
    ).filter((type) => type !== "Project Officer");

    const isValidPrimaries = presentTypes.every((type) => {
      const contactsOfType = selectedContacts.filter((c) => c.contactType === type);
      const primariesOfType = contactsOfType.filter((c) => c.isPrimary);
      if (primariesOfType.length > 1) {
        return false;
      }
      return true;
    });

    return isValidPrimaries;
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

    const selectedForComparison = selectedContacts.map((c) => ({
      personId: c.personId,
      contactType: c.contactType,
      isPrimary: c.isPrimary,
    }));

    const normalizedSelected = JSON.stringify(normalize(selectedForComparison));
    const normalizedSaved = JSON.stringify(normalize(savedForComparison));

    return normalizedSelected !== normalizedSaved;
  }, [selectedContacts, savedContacts]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const rolesToRemove: Array<{ demonstrationId: string; personId: string; roleId: string }> =
        [];
      const currentRoles = selectedContacts.filter((c) => c.contactType);

      savedContacts.forEach((savedContact) => {
        if (!savedContact.contactType) return;

        const currentContact = currentRoles.find((c) => c.personId === savedContact.personId);

        if (!currentContact) {
          rolesToRemove.push({
            demonstrationId,
            personId: savedContact.personId,
            roleId: savedContact.contactType,
          });
        } else if (currentContact.contactType !== savedContact.contactType) {
          rolesToRemove.push({
            demonstrationId,
            personId: savedContact.personId,
            roleId: savedContact.contactType,
          });
        }
      });

      if (rolesToRemove.length > 0) {
        await unsetDemonstrationRoles({
          variables: { input: rolesToRemove },
        });
      }

      await setDemonstrationRoles({
        variables: {
          input: currentRoles.map((c) => ({
            demonstrationId,
            personId: c.personId,
            roleId: c.contactType!,
            isPrimary: !!c.isPrimary,
          })),
        },
      });

      setSavedContacts(selectedContacts.map((c) => ({ ...c })));
      showSuccess("Contacts have been updated.");
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

  const contactColumns = useMemo(
    () =>
      ContactColumns({
        getFilteredContactTypeOptions,
        onContactTypeChange: handleContactTypeChange,
        onPrimaryToggle: handlePrimaryToggle,
        onRemoveContact: handleRemoveContact,
      }),
    [
      getFilteredContactTypeOptions,
      handleContactTypeChange,
      handlePrimaryToggle,
      handleRemoveContact,
    ]
  );

  const actions = (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        {showPrimaryWarning && (
          <div className="flex items-center gap-xs text-warning-dark">
            <WarningIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              You have just reassigned a primary contact type.
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-sm">
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
      </div>
    </div>
  );

  return (
    <>
      <BaseDialog
        title="Manage Contact(s)"
        onClose={onClose}
        showCancelConfirm={showCancelConfirm}
        setShowCancelConfirm={setShowCancelConfirm}
        maxWidthClass="max-w-[1000px]"
        actions={actions}
      >
        <div className="flex flex-col gap-lg">
          <div className="relative">
            <div className="mb-xs text-field-label font-bold">
              <span className="text-error mr-xs">*</span> <span className="font-bold">Search</span>
            </div>
            <div className="relative">
              <SearchIcon className="absolute top-1/2 -translate-y-1/2 text-text-placeholder h-[18px] w-[18px] pointer-events-none ml-xs" />
              <input
                name="search"
                type="text"
                className="w-full pl-9 pr-lg py-sm border border-border-fields rounded-minimal focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-surface-white text-text-filled"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                aria-label="Search for contacts by name or email"
                autoComplete="off"
              />
            </div>
            {searchResults
              .filter((p) => p.personType !== "demos-state-user")
              .filter((p) => !selectedContacts.some((c) => c.personId === p.id)).length > 0 && (
              <div
                className="absolute left-0 right-0 z-20 mt-sm border border-gray rounded-minimal p-sm bg-surface-white shadow-lg max-h-[200px] overflow-y-auto"
                role="listbox"
                aria-label="Search results"
                data-testid="search-results-dropdown"
              >
                {searchResults
                  .filter((p) => p.personType !== "demos-state-user")
                  .filter((p) => !selectedContacts.some((c) => c.personId === p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddContact(p)}
                      className="w-full text-left px-sm py-xs hover:bg-action-hover rounded-minimal focus:bg-action-hover focus:outline-none"
                      role="option"
                      aria-label={`Add ${p.firstName} ${p.lastName} (${p.email}) as contact`}
                    >
                      <div className="flex justify-between">
                        <span>{`${p.firstName} ${p.lastName}`}</span>
                        <span className="text-text-placeholder">{p.email}</span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="text-field-label font-bold">Assigned Contacts</div>

          <div
            className="border border-gray rounded-minimal overflow-hidden max-h-[400px] overflow-y-auto"
            data-testid="contacts-table-container"
          >
            <Table
              data={selectedContacts}
              columns={contactColumns}
              initialState={{
                pagination: {
                  pageSize: 50,
                },
                sorting: [
                  {
                    id: "name",
                    desc: false,
                  },
                ],
              }}
              hideSearchAndActions={true}
              pagination={(table) => <PaginationControls table={table} />}
            />
          </div>
        </div>
      </BaseDialog>

      {showDeleteConfirm && contactToDelete && (
        <ConfirmationToast
          message="Are you sure you want to remove this contact? This action cannot be undone!"
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
