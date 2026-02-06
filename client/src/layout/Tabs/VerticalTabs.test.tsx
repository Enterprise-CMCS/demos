import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { VerticalTabs, Tab } from "./";

describe("VerticalTabs Component", () => {
  const mockTabs = (
    <VerticalTabs defaultValue="tab1">
      <Tab label="Tab 1" value="tab1">
        Content 1
      </Tab>
      <Tab label="Tab 2" value="tab2">
        Content 2
      </Tab>
      <Tab label="Tab 3" value="tab3">
        Content 3
      </Tab>
    </VerticalTabs>
  );

  it("renders all tabs", () => {
    render(mockTabs);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("displays the default tab content", () => {
    render(mockTabs);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("switches tab content when a different tab is clicked", () => {
    render(mockTabs);

    const tab2Button = screen.getByTestId("button-tab2");
    fireEvent.click(tab2Button);

    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("handles single tab correctly", () => {
    const singleTab = (
      <VerticalTabs defaultValue="single">
        <Tab label="Single Tab" value="single">
          Single Content
        </Tab>
      </VerticalTabs>
    );

    render(singleTab);

    expect(screen.getByText("Single Tab")).toBeInTheDocument();
    expect(screen.getByText("Single Content")).toBeInTheDocument();
  });

  it("applies correct aria-selected attributes for selected and unselected tabs", () => {
    render(mockTabs);

    const selectedTab = screen.getByTestId("button-tab1");
    const unselectedTab = screen.getByTestId("button-tab2");

    expect(selectedTab).toHaveAttribute("aria-selected", "true");
    expect(unselectedTab).toHaveAttribute("aria-selected", "false");
  });

  it("renders collapse/expand button", () => {
    render(mockTabs);

    const collapseButton = screen.getByLabelText("Collapse tabs");
    expect(collapseButton).toBeInTheDocument();
  });

  it("toggles collapse state when collapse button is clicked", () => {
    render(mockTabs);

    const collapseButton = screen.getByLabelText("Collapse tabs");
    fireEvent.click(collapseButton);

    // After collapse, button should change to expand
    expect(screen.getByLabelText("Expand tabs")).toBeInTheDocument();
    expect(screen.queryByLabelText("Collapse tabs")).not.toBeInTheDocument();
  });

  it("shows tab labels when expanded", () => {
    render(mockTabs);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("hides tab labels when collapsed", () => {
    render(mockTabs);

    const collapseButton = screen.getByLabelText("Collapse tabs");
    fireEvent.click(collapseButton);

    // Labels should still be in DOM but hidden
    const tab1Button = screen.getByTestId("button-tab1");
    expect(tab1Button).toBeInTheDocument();
  });

  it("renders icons when provided", () => {
    const tabsWithIcons = (
      <VerticalTabs defaultValue="tab1">
        <Tab label="Tab 1" value="tab1" icon={<span data-testid="icon-1">🏠</span>}>
          Content 1
        </Tab>
        <Tab label="Tab 2" value="tab2" icon={<span data-testid="icon-2">⚙️</span>}>
          Content 2
        </Tab>
      </VerticalTabs>
    );

    render(tabsWithIcons);

    expect(screen.getByTestId("icon-1")).toBeInTheDocument();
    expect(screen.getByTestId("icon-2")).toBeInTheDocument();
  });

  it("maintains tab selection when collapsing/expanding", () => {
    render(mockTabs);

    // Select tab 2
    const tab2Button = screen.getByTestId("button-tab2");
    fireEvent.click(tab2Button);
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    // Collapse
    const collapseButton = screen.getByLabelText("Collapse tabs");
    fireEvent.click(collapseButton);

    // Content should still be tab 2
    expect(screen.getByText("Content 2")).toBeInTheDocument();

    // Expand
    const expandButton = screen.getByLabelText("Expand tabs");
    fireEvent.click(expandButton);

    // Content should still be tab 2
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.getByTestId("button-tab2")).toHaveAttribute("aria-selected", "true");
  });
});
