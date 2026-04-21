import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getDemonstration, getManyDemonstrations } from "./demonstrationData";
import { selectDemonstration, selectManyDemonstrations } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDemonstration: vi.fn(),
  selectManyDemonstrations: vi.fn(),
}));

describe("demonstrationData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
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
      expect(selectDemonstration).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single demonstration with the authorization filter applied", async () => {
      const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDemonstration).mockResolvedValueOnce(demonstration);

      const result = await getDemonstration(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDemonstration).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstration);
    });

    it("passes transaction client to selectDemonstration if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getDemonstration(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstration).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDemonstrations", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDemonstrations(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrations).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many demonstrations with the authorization filter applied", async () => {
      const demonstrations = [
        { id: "demonstration-1" },
        { id: "demonstration-2" },
      ] as PrismaDemonstration[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDemonstrations).mockResolvedValueOnce(demonstrations);

      const result = await getManyDemonstrations(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDemonstrations).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstrations);
    });

    it("passes transaction client to selectManyDemonstration if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDemonstrations(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrations).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
