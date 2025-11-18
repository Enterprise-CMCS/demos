import React from "react";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DEMONSTRATION_DETAIL_QUERY, DemonstrationDetail } from "./DemonstrationDetail";

// Mock the tab components
vi.mock("pages/DemonstrationDetail/DemonstrationTab.tsx", () => ({
  DemonstrationTab: vi.fn(() => <div data-testid="demonstration-tab">Demonstration Tab</div>),
}));

vi.mock("pages/DemonstrationDetail/AmendmentsTab.tsx", () => ({
  AmendmentsTab: vi.fn(() => <div data-testid="amendments-tab">Amendments Tab</div>),
}));

vi.mock("pages/DemonstrationDetail/ExtensionsTab.tsx", () => ({
  ExtensionsTab: vi.fn(() => <div data-testid="extensions-tab">Extensions Tab</div>),
}));

// Import mocked components to use in assertions
import { DemonstrationTab } from "./DemonstrationTab";
import { AmendmentsTab } from "./AmendmentsTab";
import { ExtensionsTab } from "./ExtensionsTab";

const DemonstrationDetailMock = {
  request: {
    query: DEMONSTRATION_DETAIL_QUERY,
    variables: { id: "1" },
  },
  result: {
    data: {
      demonstration: {
        id: "1",
        status: "Active",
        currentPhaseName: "Phase 1",
        amendments: [
          {
            id: "amendment-1",
          },
          {
            id: "amendment-2",
          },
        ],
        extensions: [
          {
            id: "extension-1",
          },
        ],
        documents: [],
        roles: [],
      },
    },
  },
};

describe("DemonstrationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntry = "/demonstrations/1") => {
    return render(
      <MockedProvider mocks={[DemonstrationDetailMock]} addTypename={false}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/demonstrations/:id" element={<DemonstrationDetail />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );
  };

  it("renders tabs with counts", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Demonstration Details/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Amendments \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Extensions \(1\)/i })).toBeInTheDocument();
  });

  it("renders on demonstration details tab by default", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId("demonstration-tab")).toBeInTheDocument();
    });

    expect(DemonstrationTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstration: expect.objectContaining({
          id: "1",
        }),
      }),
      undefined
    );
  });

  it("renders on amendments tab when query param is set", async () => {
    renderWithRouter("/demonstrations/1?amendments=amendment-1");

    await waitFor(() => {
      expect(screen.getByTestId("amendments-tab")).toBeInTheDocument();
    });

    expect(AmendmentsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
        initiallyExpandedId: "amendment-1",
      }),
      undefined
    );

    expect(screen.getByTestId("amendments-tab")).toBeInTheDocument();
  });

  it("renders on extensions tab when query param is set", async () => {
    renderWithRouter("/demonstrations/1?extensions=extension-1");

    await waitFor(() => {
      expect(screen.getByTestId("extensions-tab")).toBeInTheDocument();
    });

    expect(ExtensionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
        initiallyExpandedId: "extension-1",
      }),
      undefined
    );

    expect(screen.getByTestId("extensions-tab")).toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByTestId("demonstration-tab")).toBeInTheDocument();
    });

    // Click on Amendments tab
    const amendmentsTab = screen.getByRole("button", { name: /Amendments \(2\)/i });
    await user.click(amendmentsTab);

    await waitFor(() => {
      expect(screen.getByTestId("amendments-tab")).toBeInTheDocument();
    });

    expect(AmendmentsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
        initiallyExpandedId: undefined,
      }),
      undefined
    );

    // Click on Extensions tab
    const extensionsTab = screen.getByRole("button", { name: /Extensions \(1\)/i });
    await user.click(extensionsTab);

    await waitFor(() => {
      expect(screen.getByTestId("extensions-tab")).toBeInTheDocument();
    });

    expect(ExtensionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
        initiallyExpandedId: undefined,
      }),
      undefined
    );

    // Click back to Demonstration Details tab
    const detailsTab = screen.getByRole("button", { name: /Demonstration Details/i });
    await user.click(detailsTab);

    await waitFor(() => {
      expect(screen.getByTestId("demonstration-tab")).toBeInTheDocument();
    });
  });
});
