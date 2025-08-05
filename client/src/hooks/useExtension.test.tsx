import React, { ReactNode } from "react";

import { AddExtensionInput } from "demos-server";

import { MockedProvider } from "@apollo/client/testing";
import { renderHook } from "@testing-library/react";

import { ADD_EXTENSION_QUERY } from "../queries/extensionQueries";
import { useExtension } from "./useExtension";

const mockExtensionInput = {
  demonstrationId: "test-demo-id",
  name: "Test Extension",
  description: "Test extension description",
  effectiveDate: new Date("2024-01-01"),
  expirationDate: new Date("2024-12-31"),
  extensionStatusId: "EXTENSION_NEW",
  projectOfficerUserId: "test-user-id",
};

const mockExtensionResponse = {
  id: "test-extension-id",
  name: "Test Extension",
  description: "Test extension description",
  effectiveDate: "2024-01-01",
  expirationDate: "2024-12-31",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  demonstration: {
    id: "test-demo-id",
    name: "Test Demonstration",
  },
  extensionStatus: {
    id: "EXTENSION_NEW",
    name: "New",
  },
  projectOfficer: {
    id: "test-user-id",
    fullName: "Test User",
  },
};

const mocks = [
  {
    request: {
      query: ADD_EXTENSION_QUERY,
      variables: {
        input: mockExtensionInput,
      },
    },
    result: {
      data: {
        addExtension: mockExtensionResponse,
      },
    },
  },
];

const renderUseExtensionHook = () => {
  return renderHook(() => useExtension(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    ),
  });
};

describe("useExtension", () => {
  describe("addExtension", () => {
    it("should create extension successfully", async () => {
      const { result } = renderUseExtensionHook();

      expect(result.current.addExtension.loading).toBe(false);
      expect(result.current.addExtension.data).toBeUndefined();

      // Use type assertion to match the actual usage pattern
      const mutationResult = await result.current.addExtension.trigger(mockExtensionInput as unknown as AddExtensionInput);

      // Check the mutation result directly
      expect(mutationResult.data?.addExtension).toEqual(mockExtensionResponse);
    });
  });
});
