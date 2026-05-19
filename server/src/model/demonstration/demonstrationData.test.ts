import { Demonstration as PrismaDemonstration, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getDemonstration, getManyDemonstrations } from "./demonstrationData";
import { selectDemonstration, selectManyDemonstrations } from "./queries";
import { log } from "../../log";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDemonstration: vi.fn(),
  selectManyDemonstrations: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    warn: vi.fn(),
  },
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
    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectDemonstration).mockResolvedValueOnce(null);

      await expect(getDemonstration(where, user)).rejects.toThrow(
        "Requested Demonstration not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstration).toHaveBeenCalledExactlyOnceWith(where, undefined);
    });

    it("throws not found error when demonstration is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDemonstration).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(getDemonstration(where, user)).rejects.toThrow(
        "Requested Demonstration not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectDemonstration).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDemonstration).toHaveBeenNthCalledWith(2, where, undefined);
    });

    it("logs a warning and throws not found error when demonstration is found but user does not have permission to view it", async () => {
      const demonstration = { id: "demonstration-1" } as PrismaDemonstration;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDemonstration)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(demonstration);

      await expect(getDemonstration(where, user)).rejects.toThrow(
        "Requested Demonstration not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDemonstration).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDemonstration).toHaveBeenNthCalledWith(2, where, undefined);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to access Demonstration ${demonstration.id} without sufficient permissions.`
      );
    });

    it("returns the demonstration when found and user has permission to view it", async () => {
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
