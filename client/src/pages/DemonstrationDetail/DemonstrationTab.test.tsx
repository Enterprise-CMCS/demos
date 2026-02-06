import React from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTab, DemonstrationTabDemonstration } from "./DemonstrationTab";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";

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
});
