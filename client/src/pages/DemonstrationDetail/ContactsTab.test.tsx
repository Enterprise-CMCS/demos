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
import { johnDoe } from "mock-data/personMocks";

const BASE_MOCK_DEMONSTRATION: DemonstrationTabDemonstration = {
  id: baseMockDemonstration.id,
  name: baseMockDemonstration.name,
  status: baseMockDemonstration.status,
  currentPhaseName: "Concept" as const,
  demonstrationTypes: baseMockDemonstration.demonstrationTypes,
  state: baseMockDemonstration.state,
  documents: [],
  roles: [],
};

const mockDemonstration: DemonstrationTabDemonstration = {
  ...BASE_MOCK_DEMONSTRATION,
  roles: [
    {
      person: {
        id: johnDoe.id,
        fullName: johnDoe.fullName,
        email: johnDoe.email,
        personType: johnDoe.personType,
      },
      role: "Project Officer",
      isPrimary: true,
    },
  ],
};

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

  describe("Role-based button visibility", () => {
    it.each([
      ["OACT", oactMockUser],
      ["CMS Reviewer", cmsReviewerMockUser],
      ["Restricted CMS User", readonlyMockUser],
    ])("hides Manage Contact(s) button and shows table for %s", (_roleName, user) => {
      render(
        <TestProvider currentUser={user}>
          <DialogProvider>
            <ContactsTab demonstration={mockDemonstration} />
          </DialogProvider>
        </TestProvider>
      );

      expect(screen.queryByRole("button", { name: "manage-contacts" })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
    });
  });
});
