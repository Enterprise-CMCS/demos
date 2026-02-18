import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModificationTabs, ModificationItem } from "./ModificationTabs";

describe("ModificationTabs Component", () => {
  const mockItems: ModificationItem[] = [
    {
      id: "1",
      name: "Item 1",
      description: "Description 1",
      status: "Active",
    },
    {
      id: "2",
      name: "Item 2",
      description: "Description 2",
      status: "Pending",
    },
    {
      id: "3",
      name: "Item 3",
      description: "Description 3",
      status: "Completed",
    },
  ];

  it("renders all item names as tabs", () => {
    render(<ModificationTabs items={mockItems} />);

    expect(screen.getByTestId("modification-tab-1")).toHaveTextContent("Item 1");
    expect(screen.getByTestId("modification-tab-2")).toHaveTextContent("Item 2");
    expect(screen.getByTestId("modification-tab-3")).toHaveTextContent("Item 3");
  });

  it("sets aria-selected attribute correctly", () => {
    render(<ModificationTabs items={mockItems} />);

    const tab1Button = screen.getByTestId("modification-tab-1");
    const tab2Button = screen.getByTestId("modification-tab-2");

    expect(tab1Button).toHaveAttribute("aria-selected", "true");
    expect(tab2Button).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tab2Button);

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(<ModificationTabs items={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("handles items without optional fields", () => {
    const minimalItems: ModificationItem[] = [
      { id: "1", name: "Minimal Item 1" },
      { id: "2", name: "Minimal Item 2" },
    ];

    render(<ModificationTabs items={minimalItems} />);
  });
});
