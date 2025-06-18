import React, { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import {
  useDemonstration,
  GET_ALL_DEMONSTRATIONS,
  GET_DEMONSTRATION_BY_ID,
  ADD_DEMONSTRATION,
  UPDATE_DEMONSTRATION,
  DELETE_DEMONSTRATION,
} from "./useDemonstration";
import {
  AddDemonstrationInput,
  Demonstration,
  UpdateDemonstrationInput,
} from "demos-server";
import { testDemonstration } from "mock-data/demonstrationMocks";
import { california } from "mock-data/stateMocks";
import { johnDoe } from "mock-data/userMocks";

const mockDemonstration: Demonstration = testDemonstration;
const mockDemonstrations: Demonstration[] = [testDemonstration];

const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  demonstrationStatusId: "1",
  stateId: california.id,
  userIds: [johnDoe.id],
};

const mockUpdateDemonstrationInput: UpdateDemonstrationInput & { id: string } =
  {
    id: "1",
    name: "Updated Demonstration",
    description: "Updated Description",
  };

// Helper function to create wrapper with MockedProvider
const createWrapper = (mocks: readonly MockedResponse[]) => {
  const TestWrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      MockedProvider,
      { mocks, addTypename: false },
      children
    );
  TestWrapper.displayName = "TestWrapper";
  return TestWrapper;
};

describe("useDemonstration", () => {
  describe("getAllDemonstrations", () => {
    it("should fetch all demonstrations successfully", async () => {
      const mocks = [
        {
          request: {
            query: GET_ALL_DEMONSTRATIONS,
          },
          result: {
            data: {
              demonstrations: mockDemonstrations,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      expect(result.current.getAllDemonstrations.loading).toBe(false);
      expect(result.current.getAllDemonstrations.data).toBeUndefined();

      result.current.getAllDemonstrations.trigger();

      expect(result.current.getAllDemonstrations.data).toEqual(
        mockDemonstrations
      );
      expect(result.current.getAllDemonstrations.error).toBeUndefined();
    });

    it("should handle error when fetching all demonstrations", async () => {
      const errorMessage = "Failed to fetch demonstrations";
      const mocks = [
        {
          request: {
            query: GET_ALL_DEMONSTRATIONS,
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.getAllDemonstrations.trigger();
      await waitFor(() => {
        expect(result.current.getAllDemonstrations.error).toBeDefined();
      });

      expect(result.current.getAllDemonstrations.data).toBeUndefined();
    });
  });

  describe("getDemonstrationById", () => {
    it("should fetch demonstration by id successfully", async () => {
      const demonstrationId = "1";
      const mocks = [
        {
          request: {
            query: GET_DEMONSTRATION_BY_ID,
            variables: { id: demonstrationId },
          },
          result: {
            data: {
              demonstration: mockDemonstration,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.getDemonstrationById.trigger(demonstrationId);

      expect(result.current.getDemonstrationById.data).toEqual(
        mockDemonstration
      );
      expect(result.current.getDemonstrationById.error).toBeUndefined();
    });

    it("should handle error when fetching demonstration by id", async () => {
      const demonstrationId = "1";
      const errorMessage = "Demonstration not found";
      const mocks = [
        {
          request: {
            query: GET_DEMONSTRATION_BY_ID,
            variables: { id: demonstrationId },
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.getDemonstrationById.trigger(demonstrationId);

      await waitFor(() => {
        expect(result.current.getDemonstrationById.error).toBeDefined();
      });

      expect(result.current.getDemonstrationById.data).toBeUndefined();
    });
  });

  describe("addDemonstration", () => {
    it("should add demonstration successfully", async () => {
      const mocks = [
        {
          request: {
            query: ADD_DEMONSTRATION,
            variables: { input: mockAddDemonstrationInput },
          },
          result: {
            data: {
              addDemonstration: mockDemonstration,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      expect(result.current.addDemonstration.loading).toBe(false);
      expect(result.current.addDemonstration.data).toBeUndefined();

      result.current.addDemonstration.trigger(mockAddDemonstrationInput);

      expect(result.current.addDemonstration.data).toEqual(mockDemonstration);
      expect(result.current.addDemonstration.error).toBeUndefined();
    });

    it("should handle error when adding demonstration", async () => {
      const errorMessage = "Failed to add demonstration";
      const mocks = [
        {
          request: {
            query: ADD_DEMONSTRATION,
            variables: { input: mockAddDemonstrationInput },
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.addDemonstration.trigger(mockAddDemonstrationInput);

      await waitFor(() => {
        expect(result.current.addDemonstration.error).toBeDefined();
      });

      expect(result.current.addDemonstration.data).toBeUndefined();
    });
  });

  describe("updateDemonstration", () => {
    it("should update demonstration successfully", async () => {
      const updatedDemonstration = {
        ...mockDemonstration,
        name: "Updated Demonstration",
        description: "Updated Description",
      };

      const mocks = [
        {
          request: {
            query: UPDATE_DEMONSTRATION,
            variables: {
              input: {
                name: "Updated Demonstration",
                description: "Updated Description",
                id: "1",
              },
            },
          },
          result: {
            data: {
              updateDemonstration: updatedDemonstration,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.updateDemonstration.trigger(mockUpdateDemonstrationInput);

      expect(result.current.updateDemonstration.data).toEqual(
        updatedDemonstration
      );
      expect(result.current.updateDemonstration.error).toBeUndefined();
    });

    it("should handle error when updating demonstration", async () => {
      const errorMessage = "Failed to update demonstration";
      const mocks = [
        {
          request: {
            query: UPDATE_DEMONSTRATION,
            variables: {
              input: {
                name: "Updated Demonstration",
                description: "Updated Description",
                id: "1",
              },
            },
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.updateDemonstration.trigger(mockUpdateDemonstrationInput);

      await waitFor(() => {
        expect(result.current.updateDemonstration.error).toBeDefined();
      });

      expect(result.current.updateDemonstration.data).toBeUndefined();
    });
  });

  describe("deleteDemonstration", () => {
    it("should delete demonstration successfully", async () => {
      const demonstrationId = "1";
      const deletedDemonstration = {
        id: "1",
        name: "Test Demonstration",
      };

      const mocks = [
        {
          request: {
            query: DELETE_DEMONSTRATION,
            variables: { id: demonstrationId },
          },
          result: {
            data: {
              deleteDemonstration: deletedDemonstration,
            },
          },
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.deleteDemonstration.trigger(demonstrationId);

      expect(result.current.deleteDemonstration.data).toEqual(
        deletedDemonstration
      );
      expect(result.current.deleteDemonstration.error).toBeUndefined();
    });

    it("should handle error when deleting demonstration", async () => {
      const demonstrationId = "1";
      const errorMessage = "Failed to delete demonstration";
      const mocks = [
        {
          request: {
            query: DELETE_DEMONSTRATION,
            variables: { id: demonstrationId },
          },
          error: new Error(errorMessage),
        },
      ];

      const wrapper = createWrapper(mocks);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      result.current.deleteDemonstration.trigger(demonstrationId);

      await waitFor(() => {
        expect(result.current.deleteDemonstration.error).toBeDefined();
      });

      expect(result.current.deleteDemonstration.data).toBeUndefined();
    });
  });

  describe("initial state", () => {
    it("should have correct initial state for all operations", () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useDemonstration(), { wrapper });

      // Check initial state for all operations
      expect(result.current.getAllDemonstrations.loading).toBe(false);
      expect(result.current.getAllDemonstrations.data).toBeUndefined();
      expect(result.current.getAllDemonstrations.error).toBeUndefined();

      expect(result.current.getDemonstrationById.loading).toBe(false);
      expect(result.current.getDemonstrationById.data).toBeUndefined();
      expect(result.current.getDemonstrationById.error).toBeUndefined();

      expect(result.current.addDemonstration.loading).toBe(false);
      expect(result.current.addDemonstration.data).toBeUndefined();
      expect(result.current.addDemonstration.error).toBeUndefined();

      expect(result.current.updateDemonstration.loading).toBe(false);
      expect(result.current.updateDemonstration.data).toBeUndefined();
      expect(result.current.updateDemonstration.error).toBeUndefined();

      expect(result.current.deleteDemonstration.loading).toBe(false);
      expect(result.current.deleteDemonstration.data).toBeUndefined();
      expect(result.current.deleteDemonstration.error).toBeUndefined();
    });
  });
});
