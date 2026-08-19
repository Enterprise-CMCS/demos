import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTabDemonstration } from "./DemonstrationTab";
import { ContactsTab } from "./ContactsTab";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";

vi.mock("components/table/tables/ContactsTable", () => ({
  ContactsTable: vi.fn(() => <div data-testid="contacts-table">Contacts Table</div>),
}));

const showManageContactsDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showManageContactsDialog,
  }),
}));

const mockDemonstration: DemonstrationTabDemonstration = {
  id: "demo-123",
  state: {
    id: "NC",
  },
  name: "Contacts Test Demonstration",
  status: "Pre-Submission" as const,
  currentPhaseName: "Concept" as const,
  demonstrationTypes: [],
  documents: [
    {
      id: "doc-1",
      name: "Document 1",
      description: "Test doc 1",
      documentType: "State Application",
      createdAt: new Date(),
      owner: { person: { fullName: "John Doe" } },
    },
    {
      id: "doc-2",
      name: "Document 2",
      description: "Test doc 2",
      documentType: "Approval Letter",
      createdAt: new Date(),
      owner: { person: { fullName: "Jane Smith" } },
    },
  ],
  roles: [
    {
      person: {
        id: "person-1",
        fullName: "John Doe",
        email: "john@example.com",
        personType: "demos-cms-user",
      },
      role: "Project Officer",
      isPrimary: true,
    },
    {
      person: {
        id: "person-2",
        fullName: "Jane Smith",
        email: "jane@example.com",
        personType: "demos-state-user",
      },
      role: "State Point of Contact",
      isPrimary: false,
    },
  ],
};

const mockDemonstrationEmptyRoles: DemonstrationTabDemonstration = {
  id: "demo-123",
  state: {
    id: "NC",
  },
  name: "Contacts Test Demonstration",
  status: "Pre-Submission" as const,
  currentPhaseName: "Concept" as const,
  demonstrationTypes: [],
  documents: [
    {
      id: "doc-1",
      name: "Document 1",
      description: "Test doc 1",
      documentType: "State Application",
      createdAt: new Date(),
      owner: { person: { fullName: "John Doe" } },
    },
    {
      id: "doc-2",
      name: "Document 2",
      description: "Test doc 2",
      documentType: "Approval Letter",
      createdAt: new Date(),
      owner: { person: { fullName: "Jane Smith" } },
    },
  ],
  roles: [],
};

describe("ContactsTab", () => {
  describe("Main display", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(
        <TestProvider currentUser={cmsMockUser}>
          <ContactsTab demonstration={mockDemonstration} />
        </TestProvider>
      );
    });

    it("displays ContactsTab with correct title", () => {
      expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
    });

    it("opens manage contacts dialog when Manage Contact(s) button is clicked", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      expect(showManageContactsDialog).toHaveBeenCalled();
    });

    it("passes correct props to ContactsTable", async () => {
      expect(ContactsTable).toHaveBeenCalledWith(
        expect.objectContaining({
          demonstrationId: mockDemonstration.id,
        }),
        undefined
      );
    });

    it("passes correct existingContacts to ManageContactsDialog", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      const roles = mockDemonstration.roles.map((role) => ({
        id: `${role.role}-${role.person.id}`,
        person: {
          id: role.person.id,
          fullName: role.person.fullName,
          email: role.person.email,
          personType: role.person.personType,
        },
        role: role.role,
        isPrimary: role.isPrimary,
      }));

      // Verify the dialog gets the mapped contacts with personType
      expect(showManageContactsDialog).toHaveBeenCalledWith(mockDemonstration.id, "NC", roles);
    });

    it("shows Manage Contact(s) button in contacts tab", async () => {
      expect(screen.getByRole("button", { name: "manage-contacts" })).toBeInTheDocument();
    });
  });
  describe("empty roles", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(
        <TestProvider currentUser={cmsMockUser}>
          <ContactsTab demonstration={mockDemonstrationEmptyRoles} />
        </TestProvider>
      );
    });
    it("passes empty array to ManageContactsDialog when roles array is empty", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      expect(showManageContactsDialog).toHaveBeenCalledWith(
        mockDemonstrationEmptyRoles.id,
        "NC",
        []
      );
    });
  });
  describe("readonly user", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(
        <TestProvider currentUser={readonlyMockUser}>
          <ContactsTab demonstration={mockDemonstration} />
        </TestProvider>
      );
    });

    it("disables Manage Contact(s) button for readonly user", async () => {
      expect( screen.queryByRole("button", { name: "manage-contacts" }) ).not.toBeInTheDocument();
    });
  });
});
