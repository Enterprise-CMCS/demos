import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  DEMONSTRATION_HEADER_DETAILS_QUERY,
  DemonstrationDetailHeader,
} from "./DemonstrationDetailHeader";
import { MockedProvider } from "@apollo/client/testing";

vi.mock("components/toast/ToastContext", () => ({
  useToast: () => ({
    showToast: vi.fn(),
    hideToast: vi.fn(),
  }),
}));

const testDemonstration = {
  id: "1",
  name: "Montana Medicaid Waiver",
  status: "Approved",
  effectiveDate: new Date("2025-01-01"),
  expirationDate: new Date("2025-12-01"),
  state: { id: "MT", name: "Montana" },
  primaryProjectOfficer: { id: "po1", fullName: "John Doe" },
};

const testDemonstrationWithoutDates = {
  ...testDemonstration,
  effectiveDate: null,
  expirationDate: null,
};

// Mock GraphQL responses
const mockDemonstrationQuery = {
  request: {
    query: DEMONSTRATION_HEADER_DETAILS_QUERY,
    variables: { demonstrationId: "1" },
  },
  result: {
    data: {
      demonstration: testDemonstration,
    },
  },
};
const mockDemonstrationQueryWithoutDatesQuery = {
  request: {
    query: DEMONSTRATION_HEADER_DETAILS_QUERY,
    variables: { demonstrationId: "1" },
  },
  result: {
    data: {
      demonstration: testDemonstrationWithoutDates,
    },
  },
};

describe("Demonstration Detail Header", () => {
  it("renders demonstration header info", async () => {
    render(
      <MockedProvider mocks={[mockDemonstrationQuery]} addTypename={false}>
        <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstrationId="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    // Check back button navigation
    const backButton = screen.getByTestId("Back to demonstrations");
    expect(backButton).toBeInTheDocument();

    // Check breadcrumb navigation
    expect(screen.getByRole("link", { name: /demonstration list/i })).toBeInTheDocument();

    // Get the attributes list and verify its structure
    const attributesList = screen.getByTestId("demonstration-attributes-list");
    expect(attributesList).toBeInTheDocument();
    expect(attributesList).toHaveAttribute("role", "list");

    // Get all list items (excluding pipe separators)
    const listItems = within(attributesList).getAllByRole("listitem");
    const attributeItems = listItems.filter((item) => !item.textContent?.includes("|"));

    // Expected attributes in order
    const expectedAttributes = [
      { label: "State/Territory", value: "MT" },
      { label: "Project Officer", value: "John Doe" },
      { label: "Status", value: "Approved" },
      { label: "Effective", value: "01/01/2025" },
      { label: "Expiration", value: "12/01/2025" },
    ];

    // Verify we have the expected number of attribute items
    expect(attributeItems).toHaveLength(expectedAttributes.length);

    // Loop through and verify each attribute
    expectedAttributes.forEach((expected, index) => {
      const item = attributeItems[index];
      expect(item).toHaveTextContent(expected.label);
      expect(item).toHaveTextContent(expected.value);

      // Verify the structure: should contain both label and value
      expect(item.textContent).toMatch(new RegExp(`${expected.label}.*${expected.value}`));
    });
  });

  it("renders date placeholder as --/--/---- when dates are missing", async () => {
    render(
      <MockedProvider mocks={[mockDemonstrationQueryWithoutDatesQuery]} addTypename={false}>
        <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstrationId="1" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });
    expect(screen.getByTestId("demonstration-Effective")).toHaveTextContent("--/--/----");
    expect(screen.getByTestId("demonstration-Expiration")).toHaveTextContent("--/--/----");
  });

  it("shows Add button and dropdown options", async () => {
    render(
      <MockedProvider mocks={[mockDemonstrationQuery]} addTypename={false}>
        <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstrationId="1" />
      </MockedProvider>
    );
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    expect(toggleButton).toBeInTheDocument();
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");

    // Click the Add button to open the dropdown
    fireEvent.click(addButton);

    // Verify Amendment and Extension options appear
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-amendment")).toBeInTheDocument();
      expect(screen.getByTestId("button-create-new-extension")).toBeInTheDocument();
    });

    expect(screen.getByText("Amendment")).toBeInTheDocument();
    expect(screen.getByText("Extension")).toBeInTheDocument();
  });

  it("opens Add Amendment Modal when Amendment option is clicked", async () => {
    render(
      <MockedProvider mocks={[mockDemonstrationQuery]} addTypename={false}>
        <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstrationId="1" />
      </MockedProvider>
    );
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");
    fireEvent.click(addButton);

    // Wait for dropdown to appear and click Amendment
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-amendment")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("button-create-new-amendment"));

    // Verify Amendment modal appears
    await waitFor(() => {
      expect(screen.getByText(/New Amendment/i)).toBeInTheDocument();
    });
  });

  it("opens Add Extension Modal when Extension option is clicked", async () => {
    render(
      <MockedProvider mocks={[mockDemonstrationQuery]} addTypename={false}>
        <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstrationId="1" />
      </MockedProvider>
    );
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId("Toggle more options");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId("Create New")).toBeInTheDocument();
    });

    const addButton = screen.getByTestId("Create New");
    fireEvent.click(addButton);

    // Wait for dropdown to appear and click Extension
    await waitFor(() => {
      expect(screen.getByTestId("button-create-new-extension")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("button-create-new-extension"));

    // Verify Extension modal appears
    await waitFor(() => {
      expect(screen.getByText(/New Extension/i)).toBeInTheDocument();
    });
  });
});
