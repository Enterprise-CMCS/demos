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

  it("renders the Files tab", () => {
    setup();
    expect(screen.getByText("Files")).toBeInTheDocument();
  });

  it("renders the History tab", () => {
    setup();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("shows Files tab content by default", () => {
    setup();
    expect(screen.getByText("Files Tab Coming Soon")).toBeInTheDocument();
  });
});
