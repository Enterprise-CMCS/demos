import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, Tab } from "./Tabs";

describe("Tabs Component", () => {
  const mockTabs = (
    <Tabs>
      <Tab label="Tab 1" value="tab1">
        <div>Content 1</div>
      </Tab>
      <Tab label="Tab 2" value="tab2">
        <div>Content 2</div>
      </Tab>
      <Tab label="Tab 3" value="tab3">
        <div>Content 3</div>
      </Tab>
    </Tabs>
  );

  it("renders all tab labels", () => {
    render(mockTabs);

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("displays first tab content by default", () => {
    render(mockTabs);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("respects defaultValue prop", () => {
    render(
      <Tabs defaultValue="tab2">
        <Tab label="Tab 1" value="tab1">
          <div>Content 1</div>
        </Tab>
        <Tab label="Tab 2" value="tab2">
          <div>Content 2</div>
        </Tab>
      </Tabs>
    );

    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("switches content when tab is clicked", () => {
    render(mockTabs);

    // Initially shows first tab content
    expect(screen.getByText("Content 1")).toBeInTheDocument();

    // Click second tab
    fireEvent.click(screen.getByTestId("button-tab2"));

    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("applies correct aria-selected attributes", () => {
    render(mockTabs);

    const tab1Button = screen.getByTestId("button-tab1");
    const tab2Button = screen.getByTestId("button-tab2");

    expect(tab1Button).toHaveAttribute("aria-selected", "true");
    expect(tab2Button).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tab2Button);

    expect(tab1Button).toHaveAttribute("aria-selected", "false");
    expect(tab2Button).toHaveAttribute("aria-selected", "true");
  });

  it("applies horizontal layout classes by default", () => {
    const { container } = render(mockTabs);

    const tabList = container.querySelector("ul");
    expect(tabList).toHaveClass("flex", "-mb-px");
    expect(tabList).not.toHaveClass("flex-col");
  });

  it("applies vertical layout classes when orientation is vertical", () => {
    const { container } = render(
      <Tabs orientation="vertical">
        <Tab label="Tab 1" value="tab1">
          <div>Content 1</div>
        </Tab>
      </Tabs>
    );

    const mainContainer = container.firstChild as HTMLElement;
    const tabList = container.querySelector("ul");

    expect(mainContainer).toHaveClass("flex");
    expect(tabList).toHaveClass("flex", "flex-col");
  });

  it("handles single tab correctly", () => {
    render(
      <Tabs>
        <Tab label="Only Tab" value="only">
          <div>Only Content</div>
        </Tab>
      </Tabs>
    );

    expect(screen.getByText("Only Tab")).toBeInTheDocument();
    expect(screen.getByText("Only Content")).toBeInTheDocument();
    expect(screen.getByTestId("button-only")).toHaveAttribute("aria-selected", "true");
  });

  it("applies correct CSS classes for selected and unselected tabs", () => {
    render(mockTabs);

    const selectedTab = screen.getByTestId("button-tab1");
    const unselectedTab = screen.getByTestId("button-tab2");

    expect(selectedTab).toHaveClass("border-b-5", "text-brand");
    expect(unselectedTab).toHaveClass("text-gray-600", "hover:text-gray-800");
  });

  it("applies correct CSS classes for vertical selected tabs", () => {
    render(
      <Tabs orientation="vertical">
        <Tab label="Tab 1" value="tab1">
          <div>Content 1</div>
        </Tab>
        <Tab label="Tab 2" value="tab2">
          <div>Content 2</div>
        </Tab>
      </Tabs>
    );

    const selectedTab = screen.getByTestId("button-tab1");
    expect(selectedTab).toHaveClass(
      "border-r-4",
      "border-brand",
      "text-brand",
      "w-full",
      "text-left"
    );
  });
});
