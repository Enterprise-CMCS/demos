import { Amendment as PrismaAmendment, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getAmendment, getManyAmendments } from "./amendmentData";
import { selectAmendment, selectManyAmendments } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectAmendment: vi.fn(),
  selectManyAmendments: vi.fn(),
}));

describe("amendmentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
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
      expect(selectAmendment).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single amendment with the authorization filter applied", async () => {
      const amendment = { id: "amendment-1" } as PrismaAmendment;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectAmendment).mockResolvedValueOnce(amendment);

      const result = await getAmendment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectAmendment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(amendment);
    });

    it("passes transaction client to selectAmendment if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getAmendment(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectAmendment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyAmendments", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyAmendments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyAmendments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many amendments with the authorization filter applied", async () => {
      const amendments = [{ id: "amendment-1" }, { id: "amendment-2" }] as PrismaAmendment[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyAmendments).mockResolvedValueOnce(amendments);

      const result = await getManyAmendments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyAmendments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(amendments);
    });

    it("passes transaction client to selectManyAmendments if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyAmendments(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyAmendments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
