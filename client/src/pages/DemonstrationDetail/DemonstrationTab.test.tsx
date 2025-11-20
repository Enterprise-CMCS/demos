import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTab, DemonstrationTabDemonstration } from "./DemonstrationTab";

// Type definitions for mock components
interface MockDocumentTableProps {
  applicationId?: string;
  documents?: Array<{ id: string; [key: string]: unknown }>;
}

interface MockContactsTableProps {
  demonstrationId: string;
  roles?: Array<{ id?: string; [key: string]: unknown }>;
}

interface MockSummaryDetailsTableProps {
  demonstrationId: string;
}

// Mock the child components to avoid complex GraphQL queries
vi.mock("components/table/tables/DocumentTable", () => ({
  DocumentTable: ({ documents }: MockDocumentTableProps) => (
    <div data-testid="document-table">Document Table ({documents?.length || 0} documents)</div>
  ),
}));

vi.mock("components/table/tables/ContactsTable", () => ({
  ContactsTable: ({ roles }: MockContactsTableProps) => (
    <div data-testid="contacts-table">Contacts Table ({roles?.length || 0} contacts)</div>
  ),
}));

const showManageContactsDialog = vi.fn();
const showUploadDocumentDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showManageContactsDialog,
    showUploadDocumentDialog,
  }),
}));

// Mock the SummaryDetailsTable component to avoid GraphQL queries
vi.mock("components/table/tables/SummaryDetailsTable", () => ({
  SummaryDetailsTable: ({ demonstrationId }: MockSummaryDetailsTableProps) => (
    <div data-testid="summary-details-table">SummaryDetailsTable - ID: {demonstrationId}</div>
  ),
}));

// Mock the Tab components to ensure they render properly
vi.mock("layout/Tabs", () => ({
  VerticalTabs: ({
    children,
    defaultValue,
  }: {
    children: React.ReactNode;
    defaultValue?: string;
  }) => {
    interface TabProps {
      label: string;
      value: string;
      icon?: React.ReactNode;
      children: React.ReactNode;
    }
    const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];
    const [selectedValue, setSelectedValue] = React.useState(
      defaultValue || tabs[0]?.props.value || ""
    );
    const selectedTab = tabs.find(
      (tab: React.ReactElement<TabProps>) => tab.props.value === selectedValue
    );

    return (
      <div data-testid="vertical-tabs">
        <div className="tabs-header">
          {tabs.map((tab: React.ReactElement<TabProps>) => (
            <button
              key={tab.props.value}
              role="button"
              aria-label={tab.props.label}
              onClick={() => setSelectedValue(tab.props.value)}
              data-testid={`tab-button-${tab.props.value}`}
            >
              {tab.props.icon}
              {tab.props.label}
            </button>
          ))}
        </div>
        <div className="tab-content">{selectedTab?.props.children}</div>
      </div>
    );
  },
  Tab: ({
    children,
  }: {
    children: React.ReactNode;
    label: string;
    value: string;
    icon?: React.ReactNode;
  }) => {
    return <>{children}</>;
  },
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
    <MockedProvider mocks={[]} addTypename={false}>
      {component}
    </MockedProvider>
  );
};

describe("DemonstrationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both documents and contacts tabs", () => {
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    expect(screen.getByRole("button", { name: "Documents (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contacts (2)" })).toBeInTheDocument();
  });
  it("displays correct count when demonstration has empty documents array", () => {
    const demonstrationWithEmptyDocs: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      documents: [],
    };

    renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyDocs} />);

    expect(screen.getByRole("button", { name: "Documents (0)" })).toBeInTheDocument();
  });

  it("displays correct count when demonstration has empty roles array", () => {
    const demonstrationWithEmptyRoles: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      roles: [],
    };

    renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

    expect(screen.getByRole("button", { name: "Contacts (0)" })).toBeInTheDocument();
  });

  it("opens add document dialog when Add Document button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Click on Documents tab first if not already active
    const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
    await user.click(documentsTab);

    const addDocumentButton = screen.getByRole("button", { name: "add-new-document" });
    await user.click(addDocumentButton);

    expect(showUploadDocumentDialog).toHaveBeenCalled();
  });

  it("opens manage contacts dialog when Manage Contact(s) button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Click on Contacts tab
    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
    await user.click(manageContactsButton);

    expect(showManageContactsDialog).toHaveBeenCalled();
  });

  it("passes correct props to DocumentTable", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to documents tab to see the document table
    const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
    await user.click(documentsTab);

    expect(screen.getByTestId("document-table")).toHaveTextContent("Document Table (2 documents)");
  });

  it("passes correct props to ContactsTable", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to contacts tab
    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    expect(screen.getByTestId("contacts-table")).toHaveTextContent("Contacts Table (2 contacts)");
  });

  it("passes correct existingContacts to ManageContactsDialog", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to contacts tab and open manage dialog
    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
    await user.click(manageContactsButton);

    const roles = mockDemonstration.roles.map((role) => ({
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
    expect(showManageContactsDialog).toHaveBeenCalledWith(mockDemonstration.id, roles);
  });

  it("handles empty demonstration roles array", async () => {
    const user = userEvent.setup();
    const demonstrationWithEmptyRoles = {
      ...mockDemonstration,
      roles: [],
    };

    renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

    expect(screen.getByRole("button", { name: "Contacts (0)" })).toBeInTheDocument();

    // Switch to contacts tab and open manage dialog
    const contactsTab = screen.getByRole("button", { name: "Contacts (0)" });
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
    await user.click(manageContactsButton);

    expect(showManageContactsDialog).toHaveBeenCalledWith(demonstrationWithEmptyRoles.id, []);
  });

  it("shows details tab content by default", () => {
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Details tab should be active/visible by default
    expect(screen.getByTestId("summary-details-table")).toBeInTheDocument();
  });

  it("switches to documents tab and shows documents content", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
    await user.click(documentsTab);

    expect(screen.getByTestId("document-table")).toBeInTheDocument();
  });

  it("switches to contacts tab when clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    expect(screen.getByTestId("contacts-table")).toBeInTheDocument();
  });

  it("shows Add Document button in documents tab", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to documents tab first
    const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
    await user.click(documentsTab);

    expect(screen.getByRole("button", { name: "add-new-document" })).toBeInTheDocument();
  });

  it("shows Manage Contact(s) button in contacts tab", async () => {
    const user = userEvent.setup();
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
    await user.click(contactsTab);

    expect(screen.getByRole("button", { name: "manage-contacts" })).toBeInTheDocument();
  });

  describe("modal dialogs", () => {
    it("shows correct modal type document when document dialog opens", async () => {
      const user = userEvent.setup();
      renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

      const documentsTab = screen.getByRole("button", { name: "Documents (2)" });
      await user.click(documentsTab);

      const addDocumentButton = screen.getByRole("button", { name: "add-new-document" });
      await user.click(addDocumentButton);

      expect(showUploadDocumentDialog).toHaveBeenCalled();
    });

    it("shows correct modal type contact when contacts dialog opens", async () => {
      const user = userEvent.setup();
      renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

      const contactsTab = screen.getByRole("button", { name: "Contacts (2)" });
      await user.click(contactsTab);

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      expect(showManageContactsDialog).toHaveBeenCalled();
    });

    it("passes empty array to ManageContactsDialog when roles array is empty", async () => {
      const user = userEvent.setup();
      const demonstrationWithEmptyRoles: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        roles: [],
      };

      renderWithProvider(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

      const contactsTab = screen.getByRole("button", { name: "Contacts (0)" });
      await user.click(contactsTab);

      const manageContactsButton = screen.getByRole("button", { name: "manage-contacts" });
      await user.click(manageContactsButton);

      expect(showManageContactsDialog).toHaveBeenCalledWith(demonstrationWithEmptyRoles.id, []);
    });
  });
});
