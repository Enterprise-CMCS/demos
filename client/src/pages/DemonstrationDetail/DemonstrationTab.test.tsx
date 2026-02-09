import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTab, DemonstrationTabDemonstration } from "./DemonstrationTab";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";

const mockDemonstration: DemonstrationTabDemonstration = {
  id: "demo-123",
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

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <DialogProvider>
      <TestProvider mocks={[]} addTypename={false}>
        {component}
      </TestProvider>
    </DialogProvider>
  );
};

describe("DemonstrationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tab labels with correct counts", () => {
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    expect(screen.getByRole("button", { name: "Applications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Types (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Documents (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contacts (2)" })).toBeInTheDocument();
  });

  it("displays correct count for empty documents array", () => {
    const demonstrationWithEmptyDocs: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      documents: [],
    };

    renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyDocs} />);

    expect(screen.getByRole("button", { name: "Documents (0)" })).toBeInTheDocument();
  });

  it("displays correct count for empty roles array", () => {
    const demonstrationWithEmptyRoles: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      roles: [],
    };

    renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

    expect(screen.getByRole("button", { name: "Contacts (0)" })).toBeInTheDocument();
  });

  it("switches to contacts tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    // Verify ContactsTab content is rendered
    expect(screen.getByRole("button", { name: "manage-contacts" })).toBeInTheDocument();
  });

  it("switches to documents tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
    await user.click(documentsTab);

    // Verify documents tab content is rendered
    expect(screen.getByRole("button", { name: "add-new-document" })).toBeInTheDocument();
  });

  it("switches to types tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const typesTab = screen.getByRole("button", { name: "Types (0)" });
    await user.click(typesTab);

    // Verify types tab content is rendered
    expect(
      screen.getByRole("button", { name: "button-apply-demonstration-types" })
    ).toBeInTheDocument();
  });

  describe("Deliverables tab conditional rendering", () => {
    it('does not render Deliverables tab when status is not "Approved"', () => {
      const demonstrationNotApproved: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        status: "Pre-Submission",
      };

      renderWithProvider(<DemonstrationTab demonstration={demonstrationNotApproved} />);

      expect(screen.queryByRole("button", { name: "Deliverables" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Applications" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
    });

    it('renders Deliverables tab when status is "Approved"', () => {
      const demonstrationApproved: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        status: "Approved",
      };

      renderWithProvider(<DemonstrationTab demonstration={demonstrationApproved} />);

      expect(screen.getByRole("button", { name: "Deliverables" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Applications" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Details" })).toBeInTheDocument();
    });

    it('defaults to Applications tab when status is not "Approved"', () => {
      const demonstrationNotApproved: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        status: "Pre-Submission",
      };

      renderWithProvider(<DemonstrationTab demonstration={demonstrationNotApproved} />);

      // Application tab should be selected by default
      expect(screen.getByTestId("button-application")).toHaveAttribute("aria-selected", "true");
    });

    it('defaults to Deliverables tab when status is "Approved"', () => {
      const demonstrationApproved: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        status: "Approved",
      };

      renderWithProvider(<DemonstrationTab demonstration={demonstrationApproved} />);

      // Deliverables tab should be selected by default
      expect(screen.getByTestId("button-deliverables")).toHaveAttribute("aria-selected", "true");
    });
  });
});
