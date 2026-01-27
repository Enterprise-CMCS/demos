import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import React from "react";
import {
  getSetDemonstrationTypesInput,
  useApplyDemonstrationTypesDialogData,
  DemonstrationType,
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
} from "./useApplyDemonstrationTypesDialogData";

type DemonstrationTypeResult = DemonstrationType & { __typename: "DemonstrationTypeAssignment" };
const MOCK_DEMONSTRATION_TYPE_A: DemonstrationTypeResult = {
  __typename: "DemonstrationTypeAssignment",
  demonstrationTypeName: "Type A",
  effectiveDate: "2024-01-01",
  expirationDate: "2025-01-01",
};
const MOCK_DEMONSTRATION_TYPE_B: DemonstrationTypeResult = {
  __typename: "DemonstrationTypeAssignment",
  demonstrationTypeName: "Type B",
  effectiveDate: "2024-01-02",
  expirationDate: "2025-01-02",
};
const MOCK_DEMONSTRATION_TYPE_C: DemonstrationTypeResult = {
  __typename: "DemonstrationTypeAssignment",
  demonstrationTypeName: "Type C",
  effectiveDate: "2024-01-03",
  expirationDate: "2025-01-03",
};

describe("getSetDemonstrationTypesInput", () => {
  const demonstrationId = "demo-123";

  it("returns empty array when no initial or current types exist", () => {
    const initialTypes: DemonstrationType[] = [];
    const currentTypes: DemonstrationType[] = [];

    const result = getSetDemonstrationTypesInput(demonstrationId, initialTypes, currentTypes);

    expect(result).toEqual({
      demonstrationId: "demo-123",
      demonstrationTypes: [],
    });
  });

  it("returns all current types to add when no initial types exist", () => {
    const initialTypes: DemonstrationType[] = [];
    const currentTypes: DemonstrationType[] = [
      MOCK_DEMONSTRATION_TYPE_A,
      MOCK_DEMONSTRATION_TYPE_B,
    ];

    const result = getSetDemonstrationTypesInput(demonstrationId, initialTypes, currentTypes);

    expect(result).toEqual({
      demonstrationId: "demo-123",
      demonstrationTypes: [
        {
          demonstrationTypeName: "Type A",
          demonstrationTypeDates: {
            effectiveDate: "2024-01-01",
            expirationDate: "2025-01-01",
          },
        },
        {
          demonstrationTypeName: "Type B",
          demonstrationTypeDates: {
            effectiveDate: "2024-01-02",
            expirationDate: "2025-01-02",
          },
        },
      ],
    });
  });

  it("returns types to add and types to remove when both exist", () => {
    const initialTypes: DemonstrationType[] = [
      MOCK_DEMONSTRATION_TYPE_A,
      MOCK_DEMONSTRATION_TYPE_B,
    ];
    const currentTypes: DemonstrationType[] = [
      MOCK_DEMONSTRATION_TYPE_A,
      MOCK_DEMONSTRATION_TYPE_C,
    ];

    const result = getSetDemonstrationTypesInput(demonstrationId, initialTypes, currentTypes);

    expect(result.demonstrationId).toBe("demo-123");
    expect(result.demonstrationTypes).toHaveLength(3);

    // Should include Type A and Type C to add
    expect(result.demonstrationTypes).toContainEqual({
      demonstrationTypeName: "Type A",
      demonstrationTypeDates: {
        effectiveDate: "2024-01-01",
        expirationDate: "2025-01-01",
      },
    });
    expect(result.demonstrationTypes).toContainEqual({
      demonstrationTypeName: "Type C",
      demonstrationTypeDates: {
        effectiveDate: "2024-01-03",
        expirationDate: "2025-01-03",
      },
    });

    // Should include Type B to remove
    expect(result.demonstrationTypes).toContainEqual({
      demonstrationTypeName: "Type B",
      demonstrationTypeDates: null,
    });
  });

  it("returns only removal entries when all types are removed", () => {
    const initialTypes: DemonstrationType[] = [
      MOCK_DEMONSTRATION_TYPE_A,
      MOCK_DEMONSTRATION_TYPE_B,
    ];
    const currentTypes: DemonstrationType[] = [];

    const result = getSetDemonstrationTypesInput(demonstrationId, initialTypes, currentTypes);

    expect(result).toEqual({
      demonstrationId: "demo-123",
      demonstrationTypes: [
        {
          demonstrationTypeName: "Type A",
          demonstrationTypeDates: null,
        },
        {
          demonstrationTypeName: "Type B",
          demonstrationTypeDates: null,
        },
      ],
    });
  });

  it("handles updated dates for existing types", () => {
    const initialTypes: DemonstrationType[] = [MOCK_DEMONSTRATION_TYPE_A];
    const currentTypes: DemonstrationType[] = [
      {
        demonstrationTypeName: "Type A",
        effectiveDate: "2024-06-01",
        expirationDate: "2025-06-01",
      },
    ];

    const result = getSetDemonstrationTypesInput(demonstrationId, initialTypes, currentTypes);

    expect(result).toEqual({
      demonstrationId: "demo-123",
      demonstrationTypes: [
        {
          demonstrationTypeName: "Type A",
          demonstrationTypeDates: {
            effectiveDate: "2024-06-01",
            expirationDate: "2025-06-01",
          },
        },
      ],
    });
  });
});

describe("useApplyDemonstrationTypesDialogData", () => {
  const demonstrationId = "demo-123";

  it("loads demonstration data successfully", async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: demonstrationId },
        },
        result: {
          data: {
            demonstration: {
              id: demonstrationId,
              demonstrationTypes: [MOCK_DEMONSTRATION_TYPE_A, MOCK_DEMONSTRATION_TYPE_B],
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useApplyDemonstrationTypesDialogData(demonstrationId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.demonstration).toEqual({
      id: demonstrationId,
      demonstrationTypes: [
        {
          demonstrationTypeName: "Type A",
          effectiveDate: "2024-01-01",
          expirationDate: "2025-01-01",
        },
        {
          demonstrationTypeName: "Type B",
          effectiveDate: "2024-01-02",
          expirationDate: "2025-01-02",
        },
      ],
    });
    expect(result.current.loadingError).toBeUndefined();
    expect(result.current.saving).toBe(false);
  });

  it("handles query error", async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: demonstrationId },
        },
        error: new Error("Failed to load demonstration"),
      },
    ];

    const { result } = renderHook(() => useApplyDemonstrationTypesDialogData(demonstrationId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loadingError).toBeDefined();
    expect(result.current.loadingError?.message).toBe("Failed to load demonstration");
    expect(result.current.data).toBeUndefined();
  });

  it("saves demonstration types successfully", async () => {
    const initialTypes = [MOCK_DEMONSTRATION_TYPE_A];
    const updatedTypes = [MOCK_DEMONSTRATION_TYPE_A, MOCK_DEMONSTRATION_TYPE_B];

    const mocks: MockedResponse[] = [
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: demonstrationId },
        },
        result: {
          data: {
            demonstration: {
              id: demonstrationId,
              demonstrationTypes: initialTypes,
            },
          },
        },
      },
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
          variables: {
            input: {
              demonstrationId,
              demonstrationTypes: [
                {
                  demonstrationTypeName: "Type A",
                  demonstrationTypeDates: {
                    effectiveDate: "2024-01-01",
                    expirationDate: "2025-01-01",
                  },
                },
                {
                  demonstrationTypeName: "Type B",
                  demonstrationTypeDates: {
                    effectiveDate: "2024-01-02",
                    expirationDate: "2025-01-02",
                  },
                },
              ],
            },
          },
        },
        result: {
          data: {
            setDemonstrationTypes: {
              id: demonstrationId,
              demonstrationTypes: updatedTypes,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useApplyDemonstrationTypesDialogData(demonstrationId), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.saving).toBe(false);

    await result.current.save(demonstrationId, initialTypes, updatedTypes);

    await waitFor(() => {
      expect(result.current.saving).toBe(false);
    });
  });

  it("handles save mutation error", async () => {
    const initialTypes = [MOCK_DEMONSTRATION_TYPE_A, MOCK_DEMONSTRATION_TYPE_B];
    const updatedTypes: DemonstrationType[] = [];

    const mocks: MockedResponse[] = [
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: demonstrationId },
        },
        result: {
          data: {
            demonstration: {
              id: demonstrationId,
              demonstrationTypes: initialTypes,
            },
          },
        },
      },
      {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
          variables: {
            input: {
              demonstrationId,
              demonstrationTypes: [
                {
                  demonstrationTypeName: "Type A",
                  demonstrationTypeDates: null,
                },
                {
                  demonstrationTypeName: "Type B",
                  demonstrationTypeDates: null,
                },
              ],
            },
          },
        },
        error: new Error("Failed to update demonstration types"),
      },
    ];

    const { result } = renderHook(() => useApplyDemonstrationTypesDialogData(demonstrationId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.save(demonstrationId, initialTypes, updatedTypes)).rejects.toThrow(
      "Failed to update demonstration types"
    );
  });
});
