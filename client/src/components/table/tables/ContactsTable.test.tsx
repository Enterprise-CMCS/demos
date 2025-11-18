import React from "react";

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { CONTACTS_TABLE_QUERY, ContactsTable } from "./ContactsTable";
import { MockedProvider } from "@apollo/client/testing";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockDemonstrationRoleAssignments = [
  {
    role: "Project Officer",
    isPrimary: true,
    person: {
      id: "1",
      fullName: "John Doe",
      email: "john.doe@email.com",
    },
  },
  {
    role: "DDME Analyst",
    isPrimary: false,
    person: {
      id: "2",
      fullName: "Jane Smith",
      email: "jane.smith@email.com",
    },
  },
];

const contactsTableQueryMock = {
  request: {
    query: CONTACTS_TABLE_QUERY,
    variables: { id: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        roles: mockDemonstrationRoleAssignments,
      },
    },
  },
};

const contactsTableQuery25Mock = {
  request: {
    query: CONTACTS_TABLE_QUERY,
    variables: { id: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        roles: Array(25).fill(mockDemonstrationRoleAssignments[1]),
      },
    },
  },
};

const contactsTableQueryEmptyMock = {
  request: {
    query: CONTACTS_TABLE_QUERY,
    variables: { id: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        roles: [],
      },
    },
  },
};

describe("ContactsTable", () => {
  describe("Rendering and Data Display", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      render(
        <MockedProvider mocks={[contactsTableQueryMock]} addTypename={false}>
          <ContactsTable demonstrationId={"demo-123"} />
        </MockedProvider>
      );
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("displays all required columns: Name, Email, Contact Type, and Primary", () => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Contact Type")).toBeInTheDocument();
      expect(screen.getByText("Primary")).toBeInTheDocument();
    });

    it("displays contact information correctly", () => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@email.com")).toBeInTheDocument();
      expect(screen.getByText("Project Officer")).toBeInTheDocument();
    });

    it("displays Primary status correctly for both Yes and No values", () => {
      // Should show "Yes" for primary contact
      expect(screen.getByText("Yes")).toBeInTheDocument();

      // Should show "No" for non-primary contact
      expect(screen.getByText("No")).toBeInTheDocument();
    });

    it("displays all required fields for each contact", () => {
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Contact Type")).toBeInTheDocument();
    });

    it("allows sorting by any column", async () => {
      // Test that we can click on sortable columns without errors
      await userEvent.click(screen.getByText("Name"));
      await userEvent.click(screen.getByText("Email"));
      await userEvent.click(screen.getByText("Contact Type"));
      await userEvent.click(screen.getByText("Primary"));
    });

    it("renders table without checkboxes", () => {
      // Should not have any checkboxes since this table doesn't support selection
      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes.length).toBe(0);

      // Should still render the table with correct structure
      expect(screen.getByRole("table")).toBeInTheDocument();
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(3); // 1 header + 2 data rows
    });

    it("displays contact data in table format", () => {
      // Verify table structure
      expect(screen.getByRole("table")).toBeInTheDocument();

      // Check that we have the expected number of data rows (plus header)
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(3); // 1 header + 2 data rows
    });
  });

  describe("Pagination", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      render(
        <MockedProvider mocks={[contactsTableQuery25Mock]} addTypename={false}>
          <ContactsTable demonstrationId="demo-123" />
        </MockedProvider>
      );
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });

    it("allows navigation to specific pages and page sizes", async () => {
      // Click page 2
      await userEvent.click(screen.getByText("2"));
      // Change page size
      await userEvent.selectOptions(screen.getByRole("combobox", { name: /items per page/i }), [
        "20",
      ]);
      let rows = screen.getAllByRole("row");
      expect(rows.length).toBe(21); // 1 header row + 20 data rows
      await userEvent.click(screen.getByLabelText("Go to next page"));
      rows = screen.getAllByRole("row");
      expect(rows.length).toBe(6); // 1 header row + 5 data rows
    });

    it("displays 10 records per page by default", () => {
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });
  });

  describe("Empty Roles", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      render(
        <MockedProvider mocks={[contactsTableQueryEmptyMock]} addTypename={false}>
          <ContactsTable demonstrationId="demo-123" />
        </MockedProvider>
      );
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
    });
    it("handles empty roles array gracefully", () => {
      // Should still show headers
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Contact Type")).toBeInTheDocument();
      expect(screen.getByText("Primary")).toBeInTheDocument();

      // Should only have header row
      const rows = screen.getAllByRole("row");
      expect(rows.length).toBe(2); // header row and row indicating no data
    });
  });
});
