import { renderHook, act, waitFor } from "@testing-library/react";
import { useUserOperations } from "./useUserOperations";
import { describe, expect, it } from "vitest";
import { patrick, spongebob, squidward } from "mock-data/userMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

describe("useUserOperations", () => {
  it("can get a user by ID", async () => {
    const { result: userOperations } = renderHook(() => useUserOperations(), {
      wrapper: DemosApolloProvider,
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
      wrapper: DemosApolloProvider,
    });

    act(() => {
      userOperations.current.getAllUsers.trigger();
    });

    await waitFor(() => {
      expect(userOperations.current.getAllUsers.data).toBeDefined();
    });

    expect(userOperations.current.getAllUsers.data).toEqual([spongebob, squidward, patrick]);
    expect(userOperations.current.getAllUsers.loading).toBe(false);
    expect(userOperations.current.getAllUsers.error).toBeUndefined();
  });
});
