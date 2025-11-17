import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { AmendmentTable, AMENDMENT_TABLE_QUERY } from "./AmendmentTable";
import { ModificationTable } from "./ModificationTable";

vi.mock("./ModificationTable", () => ({
  ModificationTable: vi.fn(() => <div data-testid="modification-table">Modification Table</div>),
}));

const mockAmendments = [
  {
    id: "amendment-1",
    name: "Amendment 1",
    effectiveDate: "2023-01-01",
    status: "Active",
    createdAt: "2022-12-01",
  },
  {
    id: "amendment-2",
    name: "Amendment 2",
    effectiveDate: "2023-02-01",
    status: "Pending",
    createdAt: "2022-12-15",
  },
];

const amendmentTableQueryMock = {
  request: {
    query: AMENDMENT_TABLE_QUERY,
    variables: { demonstrationId: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        amendments: mockAmendments,
      },
    },
  },
};

const emptyAmendmentTableQueryMock = {
  request: {
    query: AMENDMENT_TABLE_QUERY,
    variables: { demonstrationId: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        amendments: [],
      },
    },
  },
};

describe("AmendmentTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(
      <MockedProvider mocks={[amendmentTableQueryMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders ModificationTable with amendments data", async () => {
    render(
      <MockedProvider mocks={[amendmentTableQueryMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Amendment",
        modifications: mockAmendments,
        initiallyExpandedId: undefined,
      }),
      undefined
    );

    expect(screen.getByTestId("modification-table")).toBeInTheDocument();
  });

  it("passes initiallyExpandedId to ModificationTable", async () => {
    render(
      <MockedProvider mocks={[amendmentTableQueryMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" initiallyExpandedId="initially-expanded-id" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Amendment",
        modifications: mockAmendments,
        initiallyExpandedId: "initially-expanded-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-table")).toBeInTheDocument();
  });

  it("renders empty ModificationTable when no amendments", async () => {
    render(
      <MockedProvider mocks={[emptyAmendmentTableQueryMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Amendment",
        modifications: [],
        initiallyExpandedId: undefined,
      }),
      undefined
    );

    expect(screen.getByTestId("modification-table")).toBeInTheDocument();
  });

  it("shows error state when query fails", async () => {
    const errorMock = {
      request: {
        query: AMENDMENT_TABLE_QUERY,
        variables: { demonstrationId: "demo-123" },
      },
      error: new Error("Failed to fetch amendments"),
    };
    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Error loading amendments.")).toBeInTheDocument();
    });

    expect(ModificationTable).not.toHaveBeenCalled();
  });

  it("shows error state when data is null", async () => {
    const nullMock = {
      request: {
        query: AMENDMENT_TABLE_QUERY,
        variables: { demonstrationId: "demo-123" },
      },
      result: {
        data: null,
      },
    };
    render(
      <MockedProvider mocks={[nullMock]} addTypename={false}>
        <AmendmentTable demonstrationId="demo-123" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading amendments.")).toBeInTheDocument();
    });

    expect(ModificationTable).not.toHaveBeenCalled();
  });
});
