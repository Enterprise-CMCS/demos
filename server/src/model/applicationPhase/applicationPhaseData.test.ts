import { ApplicationPhase as PrismaApplicationPhase, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getApplicationPhase, getManyApplicationPhases } from "./applicationPhaseData";
import { selectApplicationPhase, selectManyApplicationPhases } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectApplicationPhase: vi.fn(),
  selectManyApplicationPhases: vi.fn(),
}));

describe("applicationPhaseData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View ApplicationPhases on Assigned Demonstrations"],
  };

  const where: Prisma.ApplicationPhaseWhereInput = {
    applicationId: "application-1",
  };

  const authorizedWhereClause: Prisma.ApplicationPhaseWhereInput = {
    application: {
      demonstration: {
        demonstrationRoleAssignments: {
          some: {
            personId: user.id,
            roleId: "State Point of Contact",
          },
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

  describe("getApplicationPhase", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getApplicationPhase(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationPhase).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single applicationPhase with the authorization filter applied", async () => {
      const applicationPhase = { applicationId: "application-1" } as PrismaApplicationPhase;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectApplicationPhase).mockResolvedValueOnce(applicationPhase);

      const result = await getApplicationPhase(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectApplicationPhase).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationPhase);
    });

    it("passes transaction client to selectApplicationPhase if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getApplicationPhase(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationPhase).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyApplicationPhases", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyApplicationPhases(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationPhases).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many applicationPhases with the authorization filter applied", async () => {
      const applicationPhases = [
        { application: "application-1" },
        { applicationId: "application-2" },
      ] as PrismaApplicationPhase[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyApplicationPhases).mockResolvedValueOnce(applicationPhases);

      const result = await getManyApplicationPhases(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyApplicationPhases).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationPhases);
    });

    it("passes transaction client to selectManyApplicationPhases if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyApplicationPhases(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationPhases).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
