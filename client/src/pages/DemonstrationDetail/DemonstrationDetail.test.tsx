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

vi.mock("pages/DemonstrationDetail/modifications/AmendmentsTab.tsx", () => ({
  AmendmentsTab: vi.fn(() => <div data-testid="amendments-tab">Amendments Tab</div>),
}));

vi.mock("pages/DemonstrationDetail/modifications/ExtensionsTab.tsx", () => ({
  ExtensionsTab: vi.fn(() => <div data-testid="extensions-tab">Extensions Tab</div>),
}));

// Import mocked components to use in assertions
import { DemonstrationTab } from "./DemonstrationTab";
import { AmendmentsTab } from "./modifications/AmendmentsTab";
import { ExtensionsTab } from "./modifications/ExtensionsTab";

const demonstrationWithModifications = {
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
};

const buildDemonstrationDetailMock = (
  demonstration: typeof demonstrationWithModifications = demonstrationWithModifications
) => ({
  request: {
    query: DEMONSTRATION_DETAIL_QUERY,
    variables: { id: "1" },
  },
  result: {
    data: {
      demonstration,
    },
  },
});

describe("DemonstrationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (
    initialEntry = "/demonstrations/1",
    mock = buildDemonstrationDetailMock()
  ) => {
    return render(
      <MockedProvider mocks={[mock]}>
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
      expect(screen.getByRole("tab", { name: /Demonstration Details/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /Amendments \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Extensions \(1\)/i })).toBeInTheDocument();
  });

  it("renders empty amendment and extension tabs for approved demonstrations", async () => {
    renderWithRouter(
      "/demonstrations/1",
      buildDemonstrationDetailMock({
        ...demonstrationWithModifications,
        status: "Approved",
        amendments: [],
        extensions: [],
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Demonstration Details/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /Amendments \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Extensions \(0\)/i })).toBeInTheDocument();
  });

  it("hides empty amendment and extension tabs for demonstrations that are not approved", async () => {
    renderWithRouter(
      "/demonstrations/1",
      buildDemonstrationDetailMock({
        ...demonstrationWithModifications,
        status: "Active",
        amendments: [],
        extensions: [],
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Demonstration Details/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole("tab", { name: /Amendments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Extensions/i })).not.toBeInTheDocument();
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
        selectedAmendmentId: "amendment-1",
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
        selectedExtensionId: "extension-1",
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
    const amendmentsTab = screen.getByRole("tab", { name: /Amendments \(2\)/i });
    await user.click(amendmentsTab);

    await waitFor(() => {
      expect(screen.getByTestId("amendments-tab")).toBeInTheDocument();
    });

    expect(AmendmentsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
      }),
      undefined
    );

    // Click on Extensions tab
    const extensionsTab = screen.getByRole("tab", { name: /Extensions \(1\)/i });
    await user.click(extensionsTab);

    await waitFor(() => {
      expect(screen.getByTestId("extensions-tab")).toBeInTheDocument();
    });

    expect(ExtensionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        demonstrationId: "1",
      }),
      undefined
    );

    // Click back to Demonstration Details tab
    const detailsTab = screen.getByRole("tab", { name: /Demonstration Details/i });
    await user.click(detailsTab);

    await waitFor(() => {
      expect(screen.getByTestId("demonstration-tab")).toBeInTheDocument();
    });
  });
});
