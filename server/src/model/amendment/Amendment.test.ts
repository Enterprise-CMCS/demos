import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter } from "../../auth/buildAuthorizationFilter.js";
import { ContextUser } from "../../auth/auth.util.js";
import { getAmendment, getManyAmendments } from "./Amendment.js";
import { queryAmendment } from "./queries/queryAmendment.js";
import { queryManyAmendments } from "./queries/queryManyAmendments.js";

vi.mock("../../auth/buildAuthorizationFilter.js", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries/queryAmendment.js", () => ({
  queryAmendment: vi.fn(),
}));

vi.mock("./queries/queryManyAmendments.js", () => ({
  queryManyAmendments: vi.fn(),
}));

describe("Amendment", () => {
  const user: ContextUser = {
    id: "user-1",
    sub: "sub-1",
    role: "demos-state-user",
    permissions: ["View Amendments on Assigned Demonstrations"],
  };

  const where: Prisma.AmendmentWhereInput = {
    id: "amendment-1",
  };

  const authorizedWhereClause: Prisma.AmendmentWhereInput = {
    demonstration: {
      demonstrationRoleAssignments: {
        some: {
          personId: user.id,
          roleId: "State Point of Contact",
        },
      },
    },
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAmendment", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getAmendment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryAmendment).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single amendment with the authorization filter applied", async () => {
      const amendment = { id: "amendment-1" } as PrismaAmendment;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryAmendment).mockResolvedValueOnce(amendment);

      const result = await getAmendment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryAmendment).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(amendment);
    });
  });

  describe("getManyAmendments", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyAmendments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryManyAmendments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many amendments with the authorization filter applied", async () => {
      const amendments = [{ id: "amendment-1" }, { id: "amendment-2" }] as PrismaAmendment[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryManyAmendments).mockResolvedValueOnce(amendments);

      const result = await getManyAmendments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryManyAmendments).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(amendments);
    });
  });
});
