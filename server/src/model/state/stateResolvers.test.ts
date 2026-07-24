import { describe, expect, it, vi } from "vitest";
import { stateResolvers } from "./stateResolvers";
import { State as PrismaState } from "@prisma/client";
import { getManyDemonstrations } from "../demonstration";
import { ContextUser, GraphQLContext } from "../../auth";

const mockUser: Partial<ContextUser> = {};
const mockContext: Partial<GraphQLContext> = {
  user: mockUser as ContextUser,
};

vi.mock("../demonstration/", () => ({
  getManyDemonstrations: vi.fn(),
}));

describe("stateResolvers", () => {
  it("delegates `State.demonstrations` to `Demonstration.getManyDemonstrations`", async () => {
    await stateResolvers.State.demonstrations(
      { id: "NC" } as PrismaState,
      {},
      mockContext as GraphQLContext
    );
    expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith({ stateId: "NC" }, mockUser);
  });
});
