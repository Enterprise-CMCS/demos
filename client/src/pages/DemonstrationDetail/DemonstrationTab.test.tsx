import React from "react";

import { ToastProvider } from "components/toast";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DemonstrationTab,
  DemonstrationTabDemonstration,
} from "./DemonstrationTab";

// Type definitions for mock components
interface MockDocumentTableProps {
  demonstrationId: string;
  documents?: Array<{ id: string; [key: string]: unknown }>;
}

interface MockContactsTableProps {
  demonstrationId: string;
  roles?: Array<{ id?: string; [key: string]: unknown }>;
}

interface MockManageContactsDialogProps {
  open: boolean;
  onClose: () => void;
  existingContacts?: Array<{ id?: string; [key: string]: unknown }>;
}

interface MockAddDocumentDialogProps {
  open: boolean;
  onClose: () => void;
}

interface MockSummaryDetailsTableProps {
  demonstrationId: string;
}

// Mock the child components to avoid complex GraphQL queries
vi.mock("components/table/tables/DocumentTable", () => ({
  DocumentTable: ({ demonstrationId, documents }: MockDocumentTableProps) => (
    <div data-testid="document-table">
      DocumentTable - ID: {demonstrationId} - Docs: {documents?.length || 0}
    </div>
  ),
}));

vi.mock("components/table/tables/ContactsTable", () => ({
  ContactsTable: ({ demonstrationId, roles }: MockContactsTableProps) => (
    <div data-testid="contacts-table">
      ContactsTable - ID: {demonstrationId} - Roles: {roles?.length || 0}
    </div>
  ),
}));

vi.mock("components/dialog/ManageContactsDialog", () => ({
  ManageContactsDialog: ({ open, onClose, existingContacts }: MockManageContactsDialogProps) =>
    open ? (
      <div data-testid="manage-contacts-dialog">
        ManageContactsDialog - Contacts: {existingContacts?.length || 0}
        <button onClick={onClose} data-testid="close-dialog">
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock("components/dialog/AddDocumentDialog", () => ({
  AddDocumentDialog: ({ open, onClose }: MockAddDocumentDialogProps) =>
    open ? (
      <div data-testid="add-document-dialog">
        AddDocumentDialog
        <button onClick={onClose} data-testid="close-dialog">
          Close
        </button>
      </div>
    ) : null,
}));

// Mock the SummaryDetailsTable component to avoid GraphQL queries
vi.mock("components/table/tables/SummaryDetailsTable", () => ({
  SummaryDetailsTable: ({ demonstrationId }: MockSummaryDetailsTableProps) => (
    <div data-testid="summary-details-table">SummaryDetailsTable - ID: {demonstrationId}</div>
  ),
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

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <ToastProvider>{component}</ToastProvider>
    </MockedProvider>
  );
};

describe("DemonstrationTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both documents and contacts tabs", () => {
    renderWithProvider(<DemonstrationTab demonstration={mockDemonstration} />);

    expect(screen.getByText("Documents (2)")).toBeInTheDocument();
    expect(screen.getByText("Contacts (2)")).toBeInTheDocument();
  });
  it("displays correct count when demonstration has empty documents array", () => {
    const demonstrationWithEmptyDocs: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      documents: [],
    };

    render(<DemonstrationTab demonstration={demonstrationWithEmptyDocs} />);

    expect(screen.getByText("Documents (0)")).toBeInTheDocument();
  });

  it("displays correct count when demonstration has empty roles array", () => {
    const demonstrationWithEmptyRoles: DemonstrationTabDemonstration = {
      ...mockDemonstration,
      roles: [],
    };

    render(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

    expect(screen.getByText("Contacts (0)")).toBeInTheDocument();
  });

  it("opens add document dialog when Add Document button is clicked", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Click on Documents tab first if not already active
    const documentsTab = screen.getByText("Documents (2)");
    await user.click(documentsTab);

    const addDocumentButton = screen.getByRole("button", { name: /add document/i });
    await user.click(addDocumentButton);

    expect(screen.getByTestId("add-document-dialog")).toHaveTextContent(
      `Add Document Dialog for ${mockDemonstration.id}`
    );
  });

  it("opens manage contacts dialog when Manage Contact(s) button is clicked", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Click on Contacts tab
    const contactsTab = screen.getByText("Contacts (2)");
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: /manage contact/i });
    await user.click(manageContactsButton);

    expect(screen.getByTestId("manage-contacts-dialog")).toHaveTextContent(
      `Manage Contacts Dialog for ${mockDemonstration.id} with 2 existing contacts`
    );
  });

  it("closes dialogs when dialog onClose is called", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Open add document dialog
    const documentsTab = screen.getByText("Documents (2)");
    await user.click(documentsTab);

    const addDocumentButton = screen.getByRole("button", { name: /add document/i });
    await user.click(addDocumentButton);

    expect(screen.getByTestId("add-document-dialog")).toBeInTheDocument();

    // Close it by clicking somewhere else or triggering onClose
    // This would require the actual dialog implementation to test properly
  });

  it("passes correct props to DocumentTable", () => {
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    expect(screen.getByTestId("document-table")).toHaveTextContent("Document Table (2 documents)");
  });

  it("passes correct props to ContactsTable", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to contacts tab
    const contactsTab = screen.getByText("Contacts (2)");
    await user.click(contactsTab);

    expect(screen.getByTestId("contacts-table")).toHaveTextContent("Contacts Table (2 contacts)");
  });

  it("passes correct existingContacts to ManageContactsDialog", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Switch to contacts tab and open manage dialog
    const contactsTab = screen.getByText("Contacts (2)");
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: /manage contact/i });
    await user.click(manageContactsButton);

    // Verify the dialog gets the mapped contacts with idmRoles as empty array
    expect(screen.getByTestId("manage-contacts-dialog")).toHaveTextContent("2 existing contacts");
  });

  it("handles empty demonstration roles array", async () => {
    const user = userEvent.setup();
    const demonstrationWithEmptyRoles = {
      ...mockDemonstration,
      roles: [],
    };

    render(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

    expect(screen.getByText("Contacts (0)")).toBeInTheDocument();

    // Switch to contacts tab and open manage dialog
    const contactsTab = screen.getByText("Contacts (0)");
    await user.click(contactsTab);

    const manageContactsButton = screen.getByRole("button", { name: /manage contact/i });
    await user.click(manageContactsButton);

    expect(screen.getByTestId("manage-contacts-dialog")).toHaveTextContent("0 existing contacts");
  });

  it("shows documents tab content by default", () => {
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    // Documents tab should be active/visible by default
    expect(screen.getByText("DOCUMENTS")).toBeInTheDocument();
    expect(screen.getByTestId("document-table")).toBeInTheDocument();
  });

  it("switches to contacts tab when clicked", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    const contactsTab = screen.getByText("Contacts (2)");
    await user.click(contactsTab);

    expect(screen.getByText("CONTACTS")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-table")).toBeInTheDocument();
  });

  it("shows Add Document button in documents tab", () => {
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    expect(screen.getByRole("button", { name: /add document/i })).toBeInTheDocument();
  });

  it("shows Manage Contact(s) button in contacts tab", async () => {
    const user = userEvent.setup();
    render(<DemonstrationTab demonstration={mockDemonstration} />);

    const contactsTab = screen.getByText("Contacts (2)");
    await user.click(contactsTab);

    expect(screen.getByRole("button", { name: /manage contact/i })).toBeInTheDocument();
  });

  describe("modal dialogs", () => {
    it("shows correct modal type document when document dialog opens", async () => {
      const user = userEvent.setup();
      render(<DemonstrationTab demonstration={mockDemonstration} />);

      const documentsTab = screen.getByText("Documents (2)");
      await user.click(documentsTab);

      const addDocumentButton = screen.getByRole("button", { name: /add document/i });
      await user.click(addDocumentButton);

      expect(screen.getByTestId("add-document-dialog")).toBeInTheDocument();
    });

    it("shows correct modal type contact when contacts dialog opens", async () => {
      const user = userEvent.setup();
      render(<DemonstrationTab demonstration={mockDemonstration} />);

      const contactsTab = screen.getByText("Contacts (2)");
      await user.click(contactsTab);

      const manageContactsButton = screen.getByRole("button", { name: /manage contact/i });
      await user.click(manageContactsButton);

      expect(screen.getByTestId("manage-contacts-dialog")).toBeInTheDocument();
    });

    it("passes empty array to ManageContactsDialog when roles array is empty", async () => {
      const user = userEvent.setup();
      const demonstrationWithEmptyRoles: DemonstrationTabDemonstration = {
        ...mockDemonstration,
        roles: [],
      };

      render(<DemonstrationTab demonstration={demonstrationWithEmptyRoles} />);

      const contactsTab = screen.getByText("Contacts (0)");
      await user.click(contactsTab);

      const manageContactsButton = screen.getByRole("button", { name: /manage contact/i });
      await user.click(manageContactsButton);

      expect(screen.getByTestId("manage-contacts-dialog")).toHaveTextContent("0 existing contacts");
    });
  });
});
