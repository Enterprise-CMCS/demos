import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModificationTabs, ModificationItem } from "./ModificationTabs";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";

const createModificationItem = (overrides?: Partial<ModificationItem>): ModificationItem => {
  return {
    id: "default-id",
    medicaidId: "default-demo-id",
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
    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={mockItems} />
        </TestProvider>
      </DialogProvider>
    );

    expect(screen.getByTestId("modification-tab-1")).toHaveTextContent("Item 1");
    expect(screen.getByTestId("modification-tab-2")).toHaveTextContent("Item 2");
    expect(screen.getByTestId("modification-tab-3")).toHaveTextContent("Item 3");
  });

  it("sets aria-selected attribute correctly", () => {
    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={mockItems} />
        </TestProvider>
      </DialogProvider>
    );

    const tab1Button = screen.getByTestId("modification-tab-1");
    const tab2Button = screen.getByTestId("modification-tab-2");

    expect(tab1Button).toHaveAttribute("aria-selected", "true");
    expect(tab2Button).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tab2Button);

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("sets the selected tab based on selectedItemId prop on initial render", () => {
    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={mockItems} selectedItemId="2" />
        </TestProvider>
      </DialogProvider>
    );

    const tab1Button = screen.getByTestId("modification-tab-1");
    const tab2Button = screen.getByTestId("modification-tab-2");

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={[]} />
        </TestProvider>
      </DialogProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles items without optional fields", () => {
    const minimalItems: ModificationItem[] = [
      createModificationItem({ id: "1", name: "Minimal Item 1" }),
      createModificationItem({ id: "2", name: "Minimal Item 2" }),
    ];

    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={minimalItems} />
        </TestProvider>
      </DialogProvider>
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

    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={items} />
        </TestProvider>
      </DialogProvider>
    );

    const tabButtons = screen.getAllByRole("button");
    // Should be sorted: Second (2024), First (2023), Third (2022)
    expect(tabButtons[0]).toHaveTextContent("Second");
    expect(tabButtons[1]).toHaveTextContent("First");
    expect(tabButtons[2]).toHaveTextContent("Third");
  });

  it("initially selects the tab based on selectedItemId prop", () => {
    render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={mockItems} selectedItemId="2" />
        </TestProvider>
      </DialogProvider>
    );

    const tab1Button = screen.getByTestId("modification-tab-1");
    const tab2Button = screen.getByTestId("modification-tab-2");

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("enables horizontal scrolling with many items", () => {
    const manyItems = Array.from({ length: 20 }, (_, i) =>
      createModificationItem({ id: `${i}`, name: `Item ${i}` })
    );

    const { container } = render(
      <DialogProvider>
        <TestProvider>
          <ModificationTabs items={manyItems} />
        </TestProvider>
      </DialogProvider>
    );

    const tabList = container.querySelector(".overflow-x-auto");
    expect(tabList).not.toBeNull();
    expect(tabList).toHaveClass("overflow-x-auto");
    expect(tabList).toHaveClass("flex-nowrap");
  });

  describe("URL query parameter handling", () => {
    it("updates the URL when an amendment tab is selected", async () => {
      window.history.replaceState({}, "", "/demonstrations/test-id");

      render(
        <DialogProvider>
          <TestProvider>
            <ModificationTabs items={mockItems} />
          </TestProvider>
        </DialogProvider>
      );

      fireEvent.click(screen.getByTestId("modification-tab-2"));

      await waitFor(() => {
        expect(window.location.search).toBe("?amendments=2");
      });
    });

    it("updates the URL when a renewal tab is selected", async () => {
      window.history.replaceState({}, "", "/demonstrations/test-id");

      const renewalItems = mockItems.map((item) => ({
        ...item,
        modificationType: "renewal" as const,
      }));

      render(
        <DialogProvider>
          <TestProvider>
            <ModificationTabs items={renewalItems} />
          </TestProvider>
        </DialogProvider>
      );

      fireEvent.click(screen.getByTestId("modification-tab-2"));

      await waitFor(() => {
        expect(window.location.search).toBe("?renewals=2");
      });
    });

    it("removes the previous modification query parameter when switching types", async () => {
      window.history.replaceState(
        {},
        "",
        "/demonstrations/test-id?renewals=1"
      );

      const amendmentItems = mockItems.map((item) => ({
        ...item,
        modificationType: "amendment" as const,
      }));

      render(
        <DialogProvider>
          <TestProvider>
            <ModificationTabs
              items={amendmentItems}
              selectedItemId="2"
            />
          </TestProvider>
        </DialogProvider>
      );

      await waitFor(() => {
        expect(window.location.search).toBe("?amendments=2");
        expect(window.location.search).not.toContain("renewals");
      });
    });

    it("preserves the demonstration path when updating the URL", async () => {
      window.history.replaceState(
        {},
        "",
        "/demonstrations/test-id?someOtherParam=value"
      );

      render(
        <DialogProvider>
          <TestProvider>
            <ModificationTabs items={mockItems} />
          </TestProvider>
        </DialogProvider>
      );

      fireEvent.click(screen.getByTestId("modification-tab-2"));

      await waitFor(() => {
        expect(window.location.pathname).toBe("/demonstrations/test-id");
        expect(window.location.search).toContain("amendments=2");
        expect(window.location.search).toContain("someOtherParam=value");
      });
    });
  });
});
