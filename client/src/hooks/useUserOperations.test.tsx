import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { useUserOperations } from "./useUserOperations";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { patrick, spongebob, squidward, userMocks } from "mock-data/userMocks";

function withMocks({ children }: { children: ReactNode }) {
  return (
    <MockedProvider mocks={userMocks} addTypename={false}>
      {children}
    </MockedProvider>
  );
}

describe("useUserOperations", () => {
  it("can get a user by ID", async () => {
    const { result: userOperations } = renderHook(() => useUserOperations(), {
      wrapper: withMocks,
    });

    // Get spongebob by ID
    act(() => {
      userOperations.current.getUserById.trigger("ss");
    });

    await waitFor(() => {
      expect(userOperations.current.getUserById.data).toBeDefined();
    });

    expect(userOperations.current.getUserById.data).toEqual(spongebob);
    expect(userOperations.current.getUserById.loading).toBe(false);
    expect(userOperations.current.getUserById.error).toBeUndefined();

    // Get patrick by ID
    act(() => {
      userOperations.current.getUserById.trigger("ps");
    });

    await waitFor(() => {
      expect(userOperations.current.getUserById.data).toBeDefined();
    });

    expect(userOperations.current.getUserById.data).toEqual(patrick);
    expect(userOperations.current.getUserById.loading).toBe(false);
    expect(userOperations.current.getUserById.error).toBeUndefined();
  });

  it("can get all users", async () => {
    const { result: userOperations } = renderHook(() => useUserOperations(), {
      wrapper: withMocks,
    });

    act(() => {
      userOperations.current.getAllUsers.trigger();
    });

    await waitFor(() => {
      expect(userOperations.current.getAllUsers.data).toBeDefined();
    });

    expect(userOperations.current.getAllUsers.data).toEqual([
      spongebob,
      squidward,
      patrick,
    ]);
    expect(userOperations.current.getAllUsers.loading).toBe(false);
    expect(userOperations.current.getAllUsers.error).toBeUndefined();
  });
});
