import { describe, expect, it, vi } from "vitest";
import { stateResolvers } from "./stateResolvers";
import { ContextUser } from "../../auth/auth.util";
import { State as PrismaState } from "@prisma/client";
import { getManyDemonstrations } from "../demonstration/Demonstration";

const mockUser = {} as unknown as ContextUser;
const mockContext = {
  user: mockUser,
};

vi.mock("../demonstration/Demonstration.js", () => ({
  getManyDemonstrations: vi.fn(),
}));

describe("stateResolvers", () => {
  it("delegates `State.demonstrations` to `Demonstration.getManyDemonstrations`", async () => {
    await stateResolvers.State.demonstrations({ id: "NC" } as PrismaState, {}, mockContext);
    expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith({ stateId: "NC" }, mockUser);
  });
});
