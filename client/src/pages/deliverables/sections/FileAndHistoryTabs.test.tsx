import React from "react";
import { render, screen } from "@testing-library/react";
import { TestProvider } from "test-utils/TestProvider";
import { FileAndHistoryTabs } from "./FileAndHistoryTabs";

describe("FileAndHistoryTabs", () => {
  const setup = () =>
    render(
      <TestProvider>
        <FileAndHistoryTabs />
      </TestProvider>
    );

  it("renders the State Files tab", () => {
    setup();
    expect(screen.getByText("State Files")).toBeInTheDocument();
  });

  it("renders the CMS Files tab", () => {
    setup();
    expect(screen.getByText("CMS Files")).toBeInTheDocument();
  });


  it("renders the History tab", () => {
    setup();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("shows State Files tab content by default", () => {
    setup();
    expect(screen.getByText("State Files Tab Coming Soon")).toBeInTheDocument();
  });
});
