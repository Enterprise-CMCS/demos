import { describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth/auth.util";
import { stateResolvers } from "./stateResolvers";

describe("stateResolvers", () => {
  it("delegates `State.demonstrations` to `context.services.demonstration.getMany`", async () => {
    const getMany = vi.fn();

    const context = {
      services: {
        demonstration: {
          get: vi.fn(),
          getMany,
        },
      },
    } as unknown as GraphQLContext;

    await stateResolvers.State.demonstrations({ id: "AL" }, undefined as never, context);

    expect(getMany).toHaveBeenCalledExactlyOnceWith({
      stateId: "AL",
    });
  });
});
