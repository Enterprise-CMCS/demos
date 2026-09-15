import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import type { Tag } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import { MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION } from "mock-data/demonstrationMocks";
import { MOCK_TAGS } from "mock-data/TagMocks";
import { TYPE_TAG_SEARCH_PARAM } from "pages/admin/useSelectedTypeTag";
import { ASSOCIATED_RECORD_TYPES } from "../columns/TypeTagAssociatedRecordsColumns";
import {
  AssociatedRecordsDemonstration,
  buildAssociatedRecordRows,
  RECORD_COUNT_TEST_ID,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
  TypeTagAssociatedRecordsTable,
} from "./TypeTagAssociatedRecordsTable";

const BASE_DEMONSTRATION = MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION;
const ASSOCIATED_TAG = BASE_DEMONSTRATION.tags[0];
const UNRELATED_TAG = MOCK_TAGS.find((tag) => tag.tagName !== ASSOCIATED_TAG.tagName)!;

const WITHOUT_ASSOCIATIONS: AssociatedRecordsDemonstration = {
  ...BASE_DEMONSTRATION,
  tags: [],
  demonstrationTypes: [],
  amendments: [],
  renewals: [],
  deliverables: [],
};

const ONLY_DEMONSTRATION_RECORD: AssociatedRecordsDemonstration = {
  ...WITHOUT_ASSOCIATIONS,
  tags: [ASSOCIATED_TAG],
};

const buildMocks = (demonstrations: AssociatedRecordsDemonstration[]): MockedResponse[] => [
  {
    request: { query: TYPE_TAG_ASSOCIATED_RECORDS_QUERY },
    result: { data: { demonstrations } },
  },
];

const setup = (demonstrations: AssociatedRecordsDemonstration[] = [BASE_DEMONSTRATION]) =>
  render(
    <TestProvider
      mocks={buildMocks(demonstrations)}
      routerEntries={[
        `/admin?${TYPE_TAG_SEARCH_PARAM}=${encodeURIComponent(ASSOCIATED_TAG.tagName)}`,
      ]}
    >
      <TypeTagAssociatedRecordsTable />
    </TestProvider>
  );

const getBodyRows = () => {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows;
};

const getColumnValues = (columnIndex: number) =>
  getBodyRows().map((row) => within(row).getAllByRole("cell")[columnIndex].textContent);

describe("buildAssociatedRecordRows", () => {
  it("links each record type to its detail page", () => {
    const { id } = BASE_DEMONSTRATION;
    const [amendment] = BASE_DEMONSTRATION.amendments;
    const [renewal] = BASE_DEMONSTRATION.renewals;
    const [deliverable] = BASE_DEMONSTRATION.deliverables;

    const rows = buildAssociatedRecordRows([BASE_DEMONSTRATION], ASSOCIATED_TAG.tagName);
    const hrefsByRowId = Object.fromEntries(rows.map((row) => [row.id, row.href]));

    expect(hrefsByRowId).toMatchObject({
      [`Demonstration-${id}`]: `/demonstrations/${id}`,
      [`Amendment-${amendment.id}`]: `/demonstrations/${id}?amendments=${amendment.id}`,
      [`Renewal-${renewal.id}`]: `/demonstrations/${id}?renewals=${renewal.id}`,
      [`Demonstration Type-${id}`]: `/demonstrations/${id}`,
      [`Deliverable-${deliverable.id}`]: `/deliverables/${deliverable.id}`,
    });
  });

  it("takes the state and project officer from the parent demonstration", () => {
    const [amendmentRow] = buildAssociatedRecordRows(
      [{ ...WITHOUT_ASSOCIATIONS, amendments: BASE_DEMONSTRATION.amendments.slice(0, 1) }],
      ASSOCIATED_TAG.tagName
    );

    expect(amendmentRow).toMatchObject({
      recordType: "Amendment",
      relatedItemName: BASE_DEMONSTRATION.amendments[0].name,
      stateName: BASE_DEMONSTRATION.state.name,
      projectOfficerName: BASE_DEMONSTRATION.primaryProjectOfficer.fullName,
    });
  });

  it("leaves out records the type/tag is no longer associated with", () => {
    const demonstration: AssociatedRecordsDemonstration = {
      ...WITHOUT_ASSOCIATIONS,
      tags: [UNRELATED_TAG],
      amendments: [{ ...BASE_DEMONSTRATION.amendments[0], tags: [] }],
    };

    expect(buildAssociatedRecordRows([demonstration], ASSOCIATED_TAG.tagName)).toEqual([]);
  });
});

describe("sortAssociatedRecordsByDefault", () => {
  it("orders by record type, then by related item name in alphanumeric order", () => {
    const demonstration: AssociatedRecordsDemonstration = {
      ...BASE_DEMONSTRATION,
      amendments: [
        { id: "amendment-10", name: "Amendment 10", tags: [ASSOCIATED_TAG] },
        { id: "amendment-2", name: "Amendment 2", tags: [ASSOCIATED_TAG] },
      ],
      renewals: BASE_DEMONSTRATION.renewals.slice(0, 1),
    };
    const rows = sortAssociatedRecordsByDefault(
      buildAssociatedRecordRows([demonstration], ASSOCIATED_TAG.tagName).reverse()
    );

    expect(rows.map((row) => row.recordType)).toEqual([
      "Demonstration",
      "Amendment",
      "Amendment",
      "Renewal",
      "Demonstration Type",
      "Deliverable",
    ]);
    expect(rows.filter((row) => row.recordType === "Amendment").map((row) => row.relatedItemName))
      .toEqual(["Amendment 2", "Amendment 10"]);
  });
});

describe("TypeTagAssociatedRecordsTable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the story columns", async () => {
    setup();

    await screen.findByRole("table");
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Type/Tag Name",
      "Record Type",
      "Related Item Name",
      "State/Territory",
      "Status",
      "Project Officer",
      "Action",
    ]);
  });

  it("shows every associated record type in the default order", async () => {
    setup();

    await screen.findByRole("table");
    expect([...new Set(getColumnValues(1))]).toEqual([...ASSOCIATED_RECORD_TYPES]);
  });

  it("displays unapproved types/tags as Pending", async () => {
    const pendingTag: Tag = { ...ASSOCIATED_TAG, approvalStatus: "Unapproved" };
    setup([{ ...ONLY_DEMONSTRATION_RECORD, tags: [pendingTag] }]);

    await screen.findByRole("table");
    expect(getColumnValues(4)).toEqual(["Pending"]);
  });

  it("filters by exact record type and updates the record count", async () => {
    const user = userEvent.setup();
    const allRecordCount = buildAssociatedRecordRows(
      [BASE_DEMONSTRATION],
      ASSOCIATED_TAG.tagName
    ).length;
    setup();

    await screen.findByRole("table");
    expect(screen.getByTestId(RECORD_COUNT_TEST_ID)).toHaveTextContent(`${allRecordCount} Records`);

    await user.selectOptions(screen.getByTestId("filter-by-column"), "Record Type");
    await user.click(await screen.findByTestId("filter-recordType"));
    await user.click(screen.getByRole("checkbox", { name: "Demonstration" }));

    // "Demonstration Type" rows must not match the "Demonstration" filter value.
    await waitFor(() => expect(getColumnValues(1)).toEqual(["Demonstration"]));
    expect(screen.getByTestId(RECORD_COUNT_TEST_ID)).toHaveTextContent(/^1 Record$/);
  });

  it("opens the related record in a new browser tab", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    setup([ONLY_DEMONSTRATION_RECORD]);

    await user.click(
      await screen.findByTestId(`open-record-Demonstration-${BASE_DEMONSTRATION.id}`)
    );

    expect(openSpy).toHaveBeenCalledWith(`/demonstrations/${BASE_DEMONSTRATION.id}`, "_blank");
  });

  it("sorts by record type in descending order", async () => {
    const user = userEvent.setup();
    setup();

    const recordTypeHeader = await screen.findByRole("columnheader", { name: /Record Type/ });
    await user.click(recordTypeHeader);
    await user.click(recordTypeHeader);

    expect(getColumnValues(1)[0]).toBe("Deliverable");
  });

  it("shows the empty message when no records are associated", async () => {
    setup([WITHOUT_ASSOCIATIONS]);

    expect(
      await screen.findByText("No records are associated with this Type/Tag.")
    ).toBeInTheDocument();
    expect(screen.getByTestId(RECORD_COUNT_TEST_ID)).toHaveTextContent("0 Records");
  });

  it("paginates at 10 records per page by default", async () => {
    const demonstrations = Array.from({ length: 12 }, (_, index) => ({
      ...ONLY_DEMONSTRATION_RECORD,
      id: `demonstration-${index}`,
    }));
    setup(demonstrations);

    await screen.findByRole("table");
    expect(getBodyRows()).toHaveLength(10);
    expect(screen.getByText("1 – 10 of 12")).toBeInTheDocument();
  });
});
