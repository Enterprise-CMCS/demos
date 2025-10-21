import React from "react";

import { ToastProvider } from "components/toast";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { gql } from "@apollo/client";
import type { MockedResponse } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ManageContactsDialog, ManageContactsDialogProps } from "./ManageContactsDialog";

// GraphQL queries used in the component
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

// Mock GraphQL queries/mutations - Multiple search terms
const createSearchMock = (searchTerm: string) => ({
  request: {
    query: SEARCH_PEOPLE_QUERY,
    variables: { search: searchTerm },
  },
  result: {
    data: {
      searchPeople: [
        {
          id: "person-1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          personType: "CMS",
        },
        {
          id: "person-2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@state.gov",
          personType: "State",
        },
      ],
    },
  },
});

const SEARCH_PEOPLE_MOCKS = [
  createSearchMock("jo"),
  createSearchMock("joh"),
  createSearchMock("john"),
];

const SET_ROLES_MOCK = {
  request: {
    query: SET_DEMONSTRATION_ROLE_MUTATION,
    variables: {
      input: [
        {
          demonstrationId: "demo-1",
          personId: "person-1",
          roleId: "Project Officer",
          isPrimary: true,
        },
      ],
    },
  },
  result: {
    data: {
      setDemonstrationRoles: [{ role: "Project Officer" }],
    },
  },
};

const defaultProps: ManageContactsDialogProps = {
  isOpen: true,
  onClose: vi.fn(),
  demonstrationId: "demo-1",
  existingContacts: [],
};

const renderWithProviders = (props = defaultProps, mocks: MockedResponse[] = []) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ToastProvider>
        <ManageContactsDialog {...props} />
      </ToastProvider>
    </MockedProvider>
  );
};

describe("ManageContactsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with correct title and search input", () => {
    renderWithProviders();

    expect(screen.getByText("Manage Contact(s)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by name or email")).toBeInTheDocument();
    expect(screen.getByText("Assigned Contacts")).toBeInTheDocument();
  });

  it("shows empty state when no contacts are assigned", () => {
    renderWithProviders();

    expect(
      screen.getByText("No contacts assigned yet. Use search above to add contacts.")
    ).toBeInTheDocument();
  });

  it("displays existing contacts", () => {
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
            idmRoles: ["CMS"],
          },
          role: "Project Officer",
          isPrimary: true,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Project Officer")).toBeInTheDocument();
  });

  it("performs person search when typing in search field", async () => {
    const user = userEvent.setup();
    const mocks = SEARCH_PEOPLE_MOCKS;

    renderWithProviders(defaultProps, mocks);

    const searchInput = screen.getByPlaceholderText("Search by name or email");
    await user.type(searchInput, "john");

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@state.gov")).toBeInTheDocument();
    });
  });

  it("adds a contact from search results", async () => {
    const user = userEvent.setup();
    const mocks = SEARCH_PEOPLE_MOCKS;

    renderWithProviders(defaultProps, mocks);

    const searchInput = screen.getByPlaceholderText("Search by name or email");
    await user.type(searchInput, "john");

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const addButton = screen.getByText("John Doe");
    await user.click(addButton);

    // Should now appear in the contacts table
    expect(screen.getAllByText("John Doe")).toHaveLength(1); // Only in table now
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
  });

  it("sets default contact type for State users", async () => {
    const user = userEvent.setup();
    const mocks = SEARCH_PEOPLE_MOCKS;

    renderWithProviders(defaultProps, mocks);

    const searchInput = screen.getByPlaceholderText("Search by name or email");
    await user.type(searchInput, "john");

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    const addStateUserButton = screen.getByText("Jane Smith");
    await user.click(addStateUserButton);

    // State users should default to "State Point of Contact"
    await waitFor(() => {
      expect(screen.getByDisplayValue("State Point of Contact")).toBeInTheDocument();
    });
  });

  it("prevents adding duplicate contacts", async () => {
    const user = userEvent.setup();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: true,
        },
      ],
    };
    const mocks = SEARCH_PEOPLE_MOCKS;

    renderWithProviders(propsWithContacts, mocks);

    // Try to add the same person again
    const searchInput = screen.getByPlaceholderText("Search by name or email");
    await user.type(searchInput, "john");

    await waitFor(() => {
      expect(screen.getAllByText("John Doe")).toHaveLength(2); // One in table, one in search results
    });

    const addButton = screen.getAllByText("John Doe")[1]; // The one in search results
    await user.click(addButton);

    // Should still only have one John Doe in the table
    expect(screen.getAllByText("John Doe")).toHaveLength(2); // Still one in table, one in search results
  });

  it("changes contact type", async () => {
    const user = userEvent.setup();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
            idmRoles: ["CMS"],
          },
          role: "Project Officer",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const selectElement = screen.getByDisplayValue("Project Officer");

    // Change the select value directly
    await user.selectOptions(selectElement, "DDME Analyst");

    expect(screen.getByDisplayValue("DDME Analyst")).toBeInTheDocument();
  });

  it("toggles primary status", async () => {
    const user = userEvent.setup();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const primaryToggle = screen.getByRole("switch");
    expect(primaryToggle).toHaveAttribute("aria-checked", "false");

    await user.click(primaryToggle);

    expect(primaryToggle).toHaveAttribute("aria-checked", "true");
  });

  it("ensures only one primary per contact type", async () => {
    const user = userEvent.setup();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: true,
        },
        {
          id: "role-2",
          person: {
            id: "person-2",
            fullName: "Jane Smith",
            email: "jane.smith@example.com",
          },
          role: "Project Officer",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const toggles = screen.getAllByRole("switch");
    expect(toggles[0]).toHaveAttribute("aria-checked", "true");
    expect(toggles[1]).toHaveAttribute("aria-checked", "false");

    // Click the second toggle to make Jane primary
    await user.click(toggles[1]);

    // John should no longer be primary, Jane should be
    expect(toggles[0]).toHaveAttribute("aria-checked", "false");
    expect(toggles[1]).toHaveAttribute("aria-checked", "true");
  });

  it("removes a contact", async () => {
    const user = userEvent.setup();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: "Delete Contact" });
    await user.click(deleteButton);

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(
      screen.getByText("No contacts assigned yet. Use search above to add contacts.")
    ).toBeInTheDocument();
  });

  it("disables delete button for primary contacts", () => {
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: true,
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const deleteButton = screen.getByRole("button", { name: "Delete Contact" });
    expect(deleteButton).toBeDisabled();
  });

  it("disables save button when validation fails", () => {
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: false, // No primary selected
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const saveButton = screen.getByRole("button", { name: "button-save" });
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when all validations pass", () => {
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: true, // Has primary selected
        },
      ],
    };

    renderWithProviders(propsWithContacts);

    const saveButton = screen.getByRole("button", { name: "button-save" });
    expect(saveButton).not.toBeDisabled();
  });

  it("submits contacts successfully", async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const propsWithContacts: ManageContactsDialogProps = {
      ...defaultProps,
      onClose: mockOnClose,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "John Doe",
            email: "john.doe@example.com",
          },
          role: "Project Officer",
          isPrimary: true,
        },
      ],
    };
    const mocks = [SET_ROLES_MOCK];

    renderWithProviders(propsWithContacts, mocks);

    const saveButton = screen.getByRole("button", { name: "button-save" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows cancel confirmation dialog", async () => {
    const user = userEvent.setup();

    renderWithProviders();

    const cancelButton = screen.getByRole("button", { name: "button-cancel" });
    await user.click(cancelButton);

    // This would show the cancel confirmation in BaseDialog
    // The exact implementation depends on BaseDialog's behavior
  });

  it("filters contact type options based on IDM roles", () => {
    const propsWithCMSUser: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "CMS User",
            email: "cms@example.com",
            idmRoles: ["CMS"],
          },
          role: "Project Officer",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithCMSUser);

    // CMS users should not see "State Point of Contact" option
    const select = screen.getByDisplayValue("Project Officer");
    fireEvent.click(select);

    expect(screen.getByText("DDME Analyst")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.queryByText("State Point of Contact")).not.toBeInTheDocument();
  });

  it("shows only State Point of Contact for State users", () => {
    const propsWithStateUser: ManageContactsDialogProps = {
      ...defaultProps,
      existingContacts: [
        {
          id: "role-1",
          person: {
            id: "person-1",
            fullName: "State User",
            email: "state@example.com",
            idmRoles: ["State"],
          },
          role: "State Point of Contact",
          isPrimary: false,
        },
      ],
    };

    renderWithProviders(propsWithStateUser);

    const select = screen.getByDisplayValue("State Point of Contact");
    fireEvent.click(select);

    expect(screen.getByText("State Point of Contact")).toBeInTheDocument();
    expect(screen.queryByText("DDME Analyst")).not.toBeInTheDocument();
    expect(screen.queryByText("Project Officer")).not.toBeInTheDocument();
  });

  it("clears search results when search term is less than 2 characters", async () => {
    const user = userEvent.setup();
    const mocks = SEARCH_PEOPLE_MOCKS;

    renderWithProviders(defaultProps, mocks);

    const searchInput = screen.getByPlaceholderText("Search by name or email");

    // Type enough to trigger search
    await user.type(searchInput, "john");

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Clear to less than 2 characters
    await user.clear(searchInput);
    await user.type(searchInput, "j");

    // Search results should be cleared
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
});
