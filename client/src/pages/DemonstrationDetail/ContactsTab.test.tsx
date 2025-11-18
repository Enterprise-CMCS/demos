import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTabDemonstration } from "./DemonstrationTab";
import { ContactsTab } from "./ContactsTab";
import { ContactsTable } from "components/table/tables/ContactsTable";

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
  status: "Pre-Submission" as const,
  currentPhaseName: "Concept" as const,
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
      },
      role: "Project Officer",
      isPrimary: true,
    },
    {
      person: {
        id: "person-2",
        fullName: "Jane Smith",
        email: "jane@example.com",
      },
      role: "State Point of Contact",
      isPrimary: false,
    },
  ],
};

const mockDemonstrationEmptyRoles: DemonstrationTabDemonstration = {
  id: "demo-123",
  status: "Pre-Submission" as const,
  currentPhaseName: "Concept" as const,
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

describe("DemonstrationTab", () => {
  describe("Main display", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(<ContactsTab demonstration={mockDemonstration} />);
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
        person: {
          id: role.person.id,
          fullName: role.person.fullName,
          email: role.person.email,
          idmRoles: [], // unknown for existing; restrictions handled dynamically
        },
        role: role.role,
        isPrimary: role.isPrimary,
      }));

      // Verify the dialog gets the mapped contacts with idmRoles as empty array
      expect(showManageContactsDialog).toHaveBeenCalledWith(mockDemonstration.id, roles);
    });

    it("shows Manage Contact(s) button in contacts tab", async () => {
      expect(screen.getByRole("button", { name: "manage-contacts" })).toBeInTheDocument();
    });
  });
  describe("empty roles", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(<ContactsTab demonstration={mockDemonstrationEmptyRoles} />);
    });
    it("passes empty array to ManageContactsDialog when roles array is empty", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      expect(showManageContactsDialog).toHaveBeenCalledWith(mockDemonstrationEmptyRoles.id, []);
    });
  });
});
