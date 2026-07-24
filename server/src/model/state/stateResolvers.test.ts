import { describe, expect, it, vi } from "vitest";
import { stateResolvers } from "./stateResolvers";
import { State as PrismaState } from "@prisma/client";
import { getManyDemonstrations } from "../demonstration";
import { ContextUser, GraphQLContext } from "../../auth";
import { Loaders } from "../../loaders";

const mockUser = {} as unknown as ContextUser;
const mockContext: GraphQLContext = {
  user: mockUser,
  loaders: {} as Loaders,
};

vi.mock("../demonstration/", () => ({
  getManyDemonstrations: vi.fn(),
}));

describe("stateResolvers", () => {
  it("delegates `State.demonstrations` to `Demonstration.getManyDemonstrations`", async () => {
    await stateResolvers.State.demonstrations({ id: "NC" } as PrismaState, {}, mockContext);
    expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith({ stateId: "NC" }, mockUser);
  });
});
