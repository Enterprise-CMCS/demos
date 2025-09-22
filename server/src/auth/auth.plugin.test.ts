import { describe, it, expect } from "vitest";
import { authGatePlugin } from "./auth.plugin";
import type { GraphQLRequestListener } from "@apollo/server";

// We'll simulate the requestDidStart -> executionDidStart -> willResolveField chain
// by calling the plugin methods directly.

describe("authGatePlugin", () => {
  it("throws GraphQLError when context.user is missing for protected field", async () => {
    const plugin = authGatePlugin as any;
    const requestListener = await plugin.requestDidStart();
    const execDidStart = await requestListener.executionDidStart?.();
    const willResolve = execDidStart?.willResolveField;

    const call = () =>
      willResolve?.({
        info: { parentType: { name: "Query" }, fieldName: "protectedField" },
        contextValue: {},
      });

    expect(call).toThrow();
  });

  it("allows public fields without user in context", async () => {
    const plugin = authGatePlugin as any;
    const requestListener2 = await plugin.requestDidStart();
    const execDidStart2 = await requestListener2.executionDidStart?.();
    const willResolve2 = execDidStart2?.willResolveField;

    const call = () =>
      willResolve2?.({
        info: { parentType: { name: "Query" }, fieldName: "health" },
        contextValue: {},
      } as any);

    expect(call).not.toThrow();
  });

  it("allows fields when context.user is present", async () => {
    const plugin = authGatePlugin as any;
    const requestListener3 = await plugin.requestDidStart();
    const execDidStart3 = await requestListener3.executionDidStart?.();
    const willResolve3 = execDidStart3?.willResolveField;

    const call = () =>
      willResolve3?.({
        info: { parentType: { name: "Query" }, fieldName: "protectedField" },
        contextValue: { user: { id: "user-1" } },
      } as any);

    expect(call).not.toThrow();
  });
});
