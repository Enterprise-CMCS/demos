import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter } from "../../auth/buildAuthorizationFilter.js";
import { ContextUser } from "../../auth/auth.util.js";
import { getDemonstration, getManyDemonstrations } from "./Demonstration.js";
import { queryDemonstration } from "./queries/queryDemonstration.js";
import { queryManyDemonstrations } from "./queries/queryManyDemonstrations.js";

vi.mock("../../auth/buildAuthorizationFilter.js", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries/queryDemonstration.js", () => ({
  queryDemonstration: vi.fn(),
}));

vi.mock("./queries/queryManyDemonstrations.js", () => ({
  queryManyDemonstrations: vi.fn(),
}));

describe("Demonstration", () => {
  const user: ContextUser = {
    id: "user-1",
    sub: "sub-1",
    role: "demos-state-user",
    permissions: ["View Assigned Demonstrations"],
  };

  const where: Prisma.DemonstrationWhereInput = {
    id: "demonstration-1",
  };

  const authorizedWhereClause: Prisma.DemonstrationWhereInput = {
    demonstrationRoleAssignments: {
      some: {
        personId: user.id,
        roleId: "State Point of Contact",
      },
    },
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDemonstration", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getDemonstration(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryDemonstration).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single demonstration with the authorization filter applied", async () => {
      const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryDemonstration).mockResolvedValueOnce(demonstration);

      const result = await getDemonstration(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryDemonstration).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(demonstration);
    });
  });

  describe("getManyDemonstrations", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDemonstrations(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryManyDemonstrations).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many demonstrations with the authorization filter applied", async () => {
      const demonstrations = [
        { id: "demonstration-1" },
        { id: "demonstration-2" },
      ] as PrismaDemonstration[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryManyDemonstrations).mockResolvedValueOnce(demonstrations);

      const result = await getManyDemonstrations(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryManyDemonstrations).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(demonstrations);
    });
  });
});
