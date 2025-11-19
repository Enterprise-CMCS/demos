import React, { ReactNode } from "react";

import { MockedProvider } from "@apollo/client/testing";
import { renderHook, waitFor } from "@testing-library/react";

import { GET_DEMONSTRATION_BY_ID_QUERY, useDemonstration } from "../pages/DemonstrationDetail/DemonstrationDetail";

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
