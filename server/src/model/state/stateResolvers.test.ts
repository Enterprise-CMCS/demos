import { describe, expect, it, vi } from "vitest";
import { stateResolvers } from "./stateResolvers";
import { State as PrismaState } from "@prisma/client";
import { getManyDemonstrations } from "../demonstration/demonstrationData";
import { ContextUser } from "../../auth/userContext";
import { GraphQLContext } from "../../auth/auth.util";

const mockUser = {} as unknown as ContextUser;
const mockContext: GraphQLContext = {
  user: mockUser,
};

vi.mock("../demonstration/demonstrationData.js", () => ({
  getManyDemonstrations: vi.fn(),
}));

describe("stateResolvers", () => {
  it("delegates `State.demonstrations` to `Demonstration.getManyDemonstrations`", async () => {
    await stateResolvers.State.demonstrations({ id: "NC" } as PrismaState, {}, mockContext);
    expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith({ stateId: "NC" }, mockUser);
  });
});
