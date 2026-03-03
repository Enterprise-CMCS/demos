import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModificationTabs, ModificationItem } from "./ModificationTabs";
import { TestProvider } from "test-utils/TestProvider";
import { createAmendmentWorkflowMock } from "mock-data/workflowMocks";

const createModificationItem = (overrides?: Partial<ModificationItem>): ModificationItem => {
  return {
    id: "default-id",
    modificationType: "amendment",
    name: "Default Item",
    description: undefined,
    status: "Pre-Submission",
    createdAt: new Date(0),
    documents: [],
    ...overrides,
  };
};

describe("ModificationTabs Component", () => {
  const mockItems: ModificationItem[] = [
    createModificationItem({
      id: "1",
      name: "Item 1",
    }),
    createModificationItem({
      id: "2",
      name: "Item 2",
    }),
    createModificationItem({
      id: "3",
      name: "Item 3",
    }),
  ];

  it("renders all item names as tabs", () => {
    const mocks = [
      createAmendmentWorkflowMock("1"),
      createAmendmentWorkflowMock("2"),
      createAmendmentWorkflowMock("3"),
    ];
    render(
      <TestProvider mocks={mocks}>
        <ModificationTabs items={mockItems} />
      </TestProvider>
    );

    expect(screen.getByTestId("modification-tab-1")).toHaveTextContent("Item 1");
    expect(screen.getByTestId("modification-tab-2")).toHaveTextContent("Item 2");
    expect(screen.getByTestId("modification-tab-3")).toHaveTextContent("Item 3");
  });

  it("sets aria-selected attribute correctly", () => {
    const mocks = [
      createAmendmentWorkflowMock("1"),
      createAmendmentWorkflowMock("2"),
      createAmendmentWorkflowMock("3"),
    ];
    render(
      <TestProvider mocks={mocks}>
        <ModificationTabs items={mockItems} />
      </TestProvider>
    );

    const tab1Button = screen.getByTestId("modification-tab-1");
    const tab2Button = screen.getByTestId("modification-tab-2");

    expect(tab1Button).toHaveAttribute("aria-selected", "true");
    expect(tab2Button).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tab2Button);

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(
      <TestProvider>
        <ModificationTabs items={[]} />
      </TestProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles items without optional fields", () => {
    const minimalItems: ModificationItem[] = [
      createModificationItem({ id: "1", name: "Minimal Item 1" }),
      createModificationItem({ id: "2", name: "Minimal Item 2" }),
    ];

    const mocks = [createAmendmentWorkflowMock("1"), createAmendmentWorkflowMock("2")];

    render(
      <TestProvider mocks={mocks}>
        <ModificationTabs items={minimalItems} />
      </TestProvider>
    );
  });

  it("renders tabs in newest-to-oldest order by createdAt", () => {
    const items: ModificationItem[] = [
      createModificationItem({
        id: "1",
        name: "First",
        createdAt: new Date("2023-01-01T12:00:00Z"),
      }),
      createModificationItem({
        id: "2",
        name: "Second",
        createdAt: new Date("2024-01-01T12:00:00Z"),
      }),
      createModificationItem({
        id: "3",
        name: "Third",
        createdAt: new Date("2022-01-01T12:00:00Z"),
      }),
    ];

    const mocks = [
      createAmendmentWorkflowMock("1"),
      createAmendmentWorkflowMock("2"),
      createAmendmentWorkflowMock("3"),
    ];

    render(
      <TestProvider mocks={mocks}>
        <ModificationTabs items={items} />
      </TestProvider>
    );

    const tabButtons = screen.getAllByRole("button");
    // Should be sorted: Second (2024), First (2023), Third (2022)
    expect(tabButtons[0]).toHaveTextContent("Second");
    expect(tabButtons[1]).toHaveTextContent("First");
    expect(tabButtons[2]).toHaveTextContent("Third");
  });
});
