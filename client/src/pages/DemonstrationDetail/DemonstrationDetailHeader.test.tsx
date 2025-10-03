import React from "react";

import { mockDemonstrations } from "mock-data/demonstrationMocks";

import { render, screen, within } from "@testing-library/react";

import { DemonstrationDetailHeader } from "./DemonstrationDetailHeader";

// Helper to convert mock demonstration to proper format for DemonstrationDetailHeader
const createTestHeaderDemonstration = (mockDemo: (typeof mockDemonstrations)[0]) => ({
  id: mockDemo.id,
  name: mockDemo.name,
  status: mockDemo.status,
  effectiveDate: new Date(mockDemo.effectiveDate),
  expirationDate: new Date(mockDemo.expirationDate),
  state: mockDemo.state,
  roles: mockDemo.roles,
});

describe("Demonstration Detail Header", () => {
  it("renders demonstration header info", async () => {
    const testDemo = createTestHeaderDemonstration(mockDemonstrations[0]);
    render(
      <DemonstrationDetailHeader onEdit={() => {}} onDelete={() => {}} demonstration={testDemo} />
    );

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
    const demonstrationWithMissingDates = {
      ...mockDemonstrations[0],
      effectiveDate: null,
      expirationDate: null,
    };

    render(
      <DemonstrationDetailHeader
        onEdit={() => {}}
        onDelete={() => {}}
        demonstration={demonstrationWithMissingDates}
      />
    );
    expect(screen.getByTestId("demonstration-Effective")).toHaveTextContent("--/--/----");
    expect(screen.getByTestId("demonstration-Expiration")).toHaveTextContent("--/--/----");
  });
});
