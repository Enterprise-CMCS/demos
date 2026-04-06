import { describe, expect, it, vi } from "vitest";
import { GraphQLContext } from "../../auth/auth.util";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";

describe("demonstrationRoleAssignmentResolvers", () => {
  it("delegates `DemonstrationRoleAssignment.demonstration` to `context.services.demonstration.get`", async () => {
    const get = vi.fn();

    const context = {
      services: {
        demonstration: {
          get,
          getMany: vi.fn(),
        },
      },
    } as unknown as GraphQLContext;

    await demonstrationRoleAssigmentResolvers.DemonstrationRoleAssignment.demonstration(
      { demonstrationId: "parent-demo" },
      undefined as never,
      context
    );

    expect(get).toHaveBeenCalledExactlyOnceWith({
      id: "parent-demo",
    });
  });
});
