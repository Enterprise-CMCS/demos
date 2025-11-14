import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ExtensionTable, EXTENSION_TABLE_QUERY } from "./ExtensionTable";
import { ModificationTable } from "./ModificationTable";

vi.mock("./ModificationTable", () => ({
  ModificationTable: vi.fn(() => <div data-testid="modification-table">Modification Table</div>),
}));

const mockExtensions = [
  {
    id: "extension-1",
    name: "Extension 1",
    effectiveDate: "2023-01-01",
    status: "Active",
    createdAt: "2022-12-01",
  },
  {
    id: "extension-2",
    name: "Extension 2",
    effectiveDate: "2023-02-01",
    status: "Pending",
    createdAt: "2022-12-15",
  },
];

const extensionTableQueryMock = {
  request: {
    query: EXTENSION_TABLE_QUERY,
    variables: { demonstrationId: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        extensions: mockExtensions,
      },
    },
  },
};

const emptyExtensionTableQueryMock = {
  request: {
    query: EXTENSION_TABLE_QUERY,
    variables: { demonstrationId: "demo-123" },
  },
  result: {
    data: {
      demonstration: {
        id: "demo-123",
        extensions: [],
      },
    },
  },
};

describe("ExtensionTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    render(
      <MockedProvider mocks={[extensionTableQueryMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders ModificationTable with extensions data", async () => {
    render(
      <MockedProvider mocks={[extensionTableQueryMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Extension",
        modifications: mockExtensions,
        initiallyExpandedId: undefined,
      }),
      undefined
    );

    expect(screen.getByTestId("modification-table")).toBeInTheDocument();
  });

  it("passes initiallyExpandedId to ModificationTable", async () => {
    render(
      <MockedProvider mocks={[extensionTableQueryMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" initiallyExpandedId="initially-expanded-id" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Extension",
        modifications: mockExtensions,
        initiallyExpandedId: "initially-expanded-id",
      }),
      undefined
    );

    expect(screen.getByTestId("modification-table")).toBeInTheDocument();
  });

  it("renders empty ModificationTable when no extensions", async () => {
    render(
      <MockedProvider mocks={[emptyExtensionTableQueryMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("modification-table")).toBeInTheDocument();
    });

    expect(ModificationTable).toHaveBeenCalledWith(
      expect.objectContaining({
        modificationType: "Extension",
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
        query: EXTENSION_TABLE_QUERY,
        variables: { demonstrationId: "demo-123" },
      },
      error: new Error("Failed to fetch extensions"),
    };
    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Error loading extensions.")).toBeInTheDocument();
    });

    expect(ModificationTable).not.toHaveBeenCalled();
  });

  it("shows error state when data is null", async () => {
    const nullMock = {
      request: {
        query: EXTENSION_TABLE_QUERY,
        variables: { demonstrationId: "demo-123" },
      },
      result: {
        data: null,
      },
    };
    render(
      <MockedProvider mocks={[nullMock]} addTypename={false}>
        <ExtensionTable demonstrationId="demo-123" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading extensions.")).toBeInTheDocument();
    });

    expect(ModificationTable).not.toHaveBeenCalled();
  });
});
