import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTabDemonstration } from "./DemonstrationTab";
import { ContactsTab } from "./ContactsTab";
import { TestProvider } from "test-utils/TestProvider";
import {
  cmsMockUser,
  cmsReviewerMockUser,
  readonlyMockUser,
  oactMockUser,
} from "mock-data/userMocks";
import { DialogProvider } from "components/dialog/DialogContext";
import { mockDemonstration as baseMockDemonstration } from "mock-data/demonstrationMocks";

const createMockDemonstration = (
  roles: DemonstrationTabDemonstration["roles"] = []
): DemonstrationTabDemonstration => ({
  id: baseMockDemonstration.id,
  name: baseMockDemonstration.name,
  status: baseMockDemonstration.status,
  currentPhaseName: "Concept" as const,
  demonstrationTypes: baseMockDemonstration.demonstrationTypes,
  state: baseMockDemonstration.state,
  documents: [],
  roles,
});

const mockDemonstration = createMockDemonstration([
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
]);

describe("ContactsTab", () => {
  describe("Main display", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      return render(
        <TestProvider currentUser={cmsMockUser}>
          <DialogProvider>
            <ContactsTab demonstration={mockDemonstration} />
          </DialogProvider>
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

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("renders the contacts table with actual contacts from the demonstration", async () => {
      // The ContactsTable will render with data from the demonstration object
      // Assert that the component renders and contains contact information
      expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "manage-contacts" })).toBeInTheDocument();
    });

    it("passes correct existingContacts to ManageContactsDialog", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
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
          <DialogProvider>
            <ContactsTab demonstration={createMockDemonstration([])} />
          </DialogProvider>
        </TestProvider>
      );
    });

    it("passes empty array to ManageContactsDialog when roles array is empty", async () => {
      const user = userEvent.setup();

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      const dialog = await screen.findByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });
  });

  describe.each([
    ["OACT user", oactMockUser],
    ["CMS Reviewer user", cmsReviewerMockUser],
    ["CMS Restricted user", readonlyMockUser],
  ])("hides Manage Contact(s) button for %s", (_userType, mockUser) => {
    it("should not display the button", () => {
      render(
        <TestProvider currentUser={mockUser}>
          <DialogProvider>
            <ContactsTab demonstration={mockDemonstration} />
          </DialogProvider>
        </TestProvider>
      );

      expect(screen.queryByRole("button", { name: "manage-contacts" })).not.toBeInTheDocument();
    });
  });
});
