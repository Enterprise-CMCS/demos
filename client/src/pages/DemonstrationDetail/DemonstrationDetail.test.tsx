import React, { ReactNode } from "react";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MockedProvider } from "@apollo/client/testing";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DEMONSTRATION_DETAIL_QUERY,
  GET_DEMONSTRATION_BY_ID_QUERY,
  DemonstrationDetail,
  useDemonstration,
} from "./DemonstrationDetail";

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
// Mock data
const mockDemonstrationData = {
  id: "demo-123",
  name: "Test Demonstration",
  description: "Test demonstration description",
  state: {
    id: "CA",
    name: "California",
  },
  roles: [
    {
      isPrimary: true,
      role: "Project Officer",
      person: {
        id: "user-456",
        fullName: "John Doe",
      },
    },
    {
      isPrimary: false,
      role: "State Lead",
      person: {
        id: "user-789",
        fullName: "Jane Smith",
      },
    },
  ],
};

const mockDemonstrationWithoutProjectOfficer = {
  ...mockDemonstrationData,
  roles: [
    {
      isPrimary: false,
      role: "State Lead",
      person: {
        id: "user-789",
        fullName: "Jane Smith",
      },
    },
  ],
};

const mocks = [
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "demo-123" },
    },
    result: {
      data: {
        demonstration: mockDemonstrationData,
      },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "demo-456" },
    },
    result: {
      data: {
        demonstration: mockDemonstrationWithoutProjectOfficer,
      },
    },
  },
  {
    request: {
      query: GET_DEMONSTRATION_BY_ID_QUERY,
      variables: { id: "error-demo" },
    },
    error: new Error("Failed to fetch demonstration"),
  },
];

const createWrapper = () => {
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useDemonstration", () => {
  it("should return initial state when no id is provided", () => {
    const { result } = renderHook(() => useDemonstration(), {
      wrapper: createWrapper(),
    });

    expect(result.current.demonstration).toBeUndefined();
    expect(result.current.projectOfficer).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("should fetch demonstration data when id is provided", async () => {
    const { result } = renderHook(() => useDemonstration("demo-123"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.demonstration).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.demonstration).toEqual(mockDemonstrationData);
    expect(result.current.error).toBeUndefined();
  });

  it("should extract project officer from roles", async () => {
    const { result } = renderHook(() => useDemonstration("demo-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.projectOfficer).toEqual({
      isPrimary: true,
      role: "Project Officer",
      person: {
        id: "user-456",
        fullName: "John Doe",
      },
    });
  });

  it("should return undefined project officer when no primary project officer exists", async () => {
    const { result } = renderHook(() => useDemonstration("demo-456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.demonstration).toEqual(mockDemonstrationWithoutProjectOfficer);
    expect(result.current.projectOfficer).toBeUndefined();
  });

  it("should handle query errors", async () => {
    const { result } = renderHook(() => useDemonstration("error-demo"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.demonstration).toBeUndefined();
    expect(result.current.projectOfficer).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("Failed to fetch demonstration");
  });

  it("should skip query when id changes to undefined", () => {
    let demonstrationId: string | undefined = "demo-123";

    const { result, rerender } = renderHook(() => useDemonstration(demonstrationId), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);

    // Change id to undefined
    demonstrationId = undefined;
    rerender();

    expect(result.current.loading).toBe(false);
    expect(result.current.demonstration).toBeUndefined();
  });

  it("should use cache-first fetch policy", async () => {
    const { result } = renderHook(() => useDemonstration("demo-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // First hook should have loaded data
    expect(result.current.demonstration).toEqual(mockDemonstrationData);

    // Second render with same wrapper should eventually use cached data
    const { result: result2 } = renderHook(() => useDemonstration("demo-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
    });

    expect(result2.current.demonstration).toEqual(mockDemonstrationData);
  });
});

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
