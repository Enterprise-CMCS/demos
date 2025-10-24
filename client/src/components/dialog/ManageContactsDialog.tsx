import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Button, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { SearchIcon, WarningIcon } from "components/icons";
import { Table } from "components/table/Table";
import { useToast } from "components/toast";
import { ConfirmationToast } from "components/toast/ConfirmationToast";

import { useLazyQuery, useMutation } from "@apollo/client";

import {
  DEMONSTRATION_DETAIL_QUERY,
  DEMONSTRATION_HEADER_DETAILS_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  SEARCH_PEOPLE_QUERY,
  SET_DEMONSTRATION_ROLE_MUTATION,
  UNSET_DEMONSTRATION_ROLES_MUTATION,
} from "../../queries/contactQueries";
import type { ContactRow, ContactType } from "../table/columns/ContactColumns";
import { CONTACT_TYPES, ContactColumns } from "../table/columns/ContactColumns";
import { PaginationControls } from "../table/PaginationControls";

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

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timeout);
  }, [value, ms]);

  return debounced;
}

const mapExistingContacts = (arr: ManageContactsDialogProps["existingContacts"] = []) =>
  arr.map((c) => ({
    id: c.id,
    personId: c.person.id,
    name: c.person.fullName,
    email: c.person.email,
    idmRoles: c.person.idmRoles ?? [],
    contactType: c.role as ContactType,
    isPrimary: c.isPrimary,
  }));

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
      const rawResults = data.searchPeople || [];
      // Filter out state users to prevent foreign key constraint errors
      // State users can only be assigned to demonstrations in their own state
      // Until the backend is updated to include state information in search results,
      // we temporarily exclude all state users from search
      const filteredResults = rawResults.filter((person: PersonSearchResult) => {
        // Temporarily exclude all state users to prevent database constraint violations
        // TODO: Update backend searchPeople resolver to filter by demonstration state
        return person.personType !== "demos-state-user";
      });
      setSearchResults(filteredResults);
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
      "demos-cms-user": CONTACT_TYPE_OPTIONS.filter((o) => o.value !== "State Point of Contact"),
      "demos-state-user": CONTACT_TYPE_OPTIONS.filter((o) => o.value === "State Point of Contact"),
      "demos-admin": CONTACT_TYPE_OPTIONS,
      Default: CONTACT_TYPE_OPTIONS,
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

      const idmRoles = [person.personType];

      let defaults: { contactType?: ContactType; isPrimary: boolean };

      const availableTypes = getFilteredContactTypeOptions(idmRoles);

      if (person.personType === "demos-state-user") {
        defaults = {
          contactType: "State Point of Contact" as ContactType,
          isPrimary: false,
        };
      } else if (person.personType === "demos-cms-user") {
        if (existingProjectOfficers.length === 0) {
          defaults = { contactType: "Project Officer" as ContactType, isPrimary: true };
        } else {
          const nonStateOptions = availableTypes.filter(
            (opt) => opt.value !== "State Point of Contact"
          );
          defaults = {
            contactType:
              nonStateOptions.length > 0 ? (nonStateOptions[0].value as ContactType) : undefined,
            isPrimary: false,
          };
        }
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
          idmRoles: idmRoles,
          ...defaults,
        },
      ];
    });

    setSearchResults([]);
    setSearchTerm("");
  };

  const handleContactTypeChange = useCallback(
    (personId: string, newType?: ContactType) => {
      setSelectedContacts((prev) => {
        const isPO = newType === "Project Officer";

        return prev.map((c) => {
          if (c.personId === personId) {
            return { ...c, contactType: newType, isPrimary: isPO };
          }

          if (isPO && c.contactType === "Project Officer") {
            const availableOptions = getFilteredContactTypeOptions(c.idmRoles);
            const nonProjectOfficerOptions = availableOptions.filter(
              (opt) => opt.value !== "Project Officer"
            );

            return {
              ...c,
              contactType:
                nonProjectOfficerOptions.length > 0
                  ? (nonProjectOfficerOptions[0].value as ContactType)
                  : undefined,
              isPrimary: false,
            };
          }

          return c;
        });
      });
    },
    [getFilteredContactTypeOptions]
  );

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
        if (target.isPrimary && projectOfficers.length === 1) {
          return prev;
        }

        if (!target.isPrimary && existingPrimary) {
          setShowPrimaryWarning(true);
          setTimeout(() => setShowPrimaryWarning(false), 3000);
        }

        return prev.map((c) => {
          if (c.contactType === "Project Officer") {
            return { ...c, isPrimary: c.personId === personId };
          }
          return c;
        });
      } else {
        if (!target.isPrimary && existingPrimary) {
          setShowPrimaryWarning(true);
          setTimeout(() => setShowPrimaryWarning(false), 3000);
        }

        const willBePrimary = !target.isPrimary;
        return prev.map((c) => {
          if (c.personId === personId) {
            return { ...c, isPrimary: willBePrimary };
          }
          if (c.contactType === type) {
            return { ...c, isPrimary: false };
          }
          return c;
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
    if (projectOfficers.length !== 1) {
      return false;
    }

    if (!projectOfficers[0].isPrimary) {
      return false;
    }

    const presentTypes = Array.from(
      new Set(selectedContacts.map((c) => c.contactType).filter(Boolean) as string[])
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

      if (rolesToRemove.length > 0) {
        await unsetDemonstrationRoles({
          variables: { input: rolesToRemove },
        });
      }

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
        selectedContacts,
        getFilteredContactTypeOptions,
        onContactTypeChange: handleContactTypeChange,
        onPrimaryToggle: handlePrimaryToggle,
        onRemoveContact: handleRemoveContact,
      }),
    [
      selectedContacts,
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
        isOpen={isOpen}
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
            {searchResults.filter((p) => !selectedContacts.some((c) => c.personId === p.id))
              .length > 0 && (
              <div
                className="absolute left-0 right-0 z-20 mt-sm border border-gray rounded-minimal p-sm bg-surface-white shadow-lg max-h-[200px] overflow-y-auto"
                role="listbox"
                aria-label="Search results"
                data-testid="search-results-dropdown"
              >
                {searchResults
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
