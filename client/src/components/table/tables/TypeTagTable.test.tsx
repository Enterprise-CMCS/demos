import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_TAGS } from "mock-data/TagMocks";
import { TYPE_TAG_MANAGEMENT_QUERY, TypeTagTable } from "./TypeTagTable";

const SUMMARIES = MOCK_TAGS.map((tag) => ({
  demonstrationTypeName: tag.tagName,
  approvalStatus: tag.approvalStatus,
}));

const buildMocks = (summaries: typeof SUMMARIES): MockedResponse[] => [
  {
    request: { query: TYPE_TAG_MANAGEMENT_QUERY },
    result: { data: { demonstrationTypeUsageSummary: summaries } },
  },
];

const setup = (summaries = SUMMARIES) =>
  render(
    <TestProvider mocks={buildMocks(summaries)}>
      <TypeTagTable />
    </TestProvider>
  );

const getColumnValues = (columnIndex: number) => {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows.map((row) => within(row).getAllByRole("cell")[columnIndex].textContent);
};

describe("TypeTagTable", () => {
  it("lists types/tags alphabetically", async () => {
    setup([...SUMMARIES].reverse());

    await screen.findByRole("table");
    expect(getColumnValues(0)).toEqual(
      SUMMARIES.map((summary) => summary.demonstrationTypeName).sort((a, b) => a.localeCompare(b))
    );
  });

  it("displays unapproved types/tags as Pending", async () => {
    setup();

    await screen.findByRole("table");
    const unapprovedCount = SUMMARIES.filter(
      (summary) => summary.approvalStatus === "Unapproved"
    ).length;
    expect(getColumnValues(1).filter((status) => status === "Pending")).toHaveLength(
      unapprovedCount
    );
  });
});
