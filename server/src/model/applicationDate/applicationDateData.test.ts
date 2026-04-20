import { ApplicationDate as PrismaApplicationDate, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getApplicationDate, getManyApplicationDates } from "./applicationDateData";
import { selectApplicationDate, selectManyApplicationDates } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectApplicationDate: vi.fn(),
  selectManyApplicationDates: vi.fn(),
}));

describe("./applicationDateData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View ApplicationDates on Assigned Demonstrations"],
  };

  const where: Prisma.ApplicationDateWhereInput = {
    applicationId: "application-1",
  };

  const authorizedWhereClause: Prisma.ApplicationDateWhereInput = {
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

  describe("getApplicationDate", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getApplicationDate(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationDate).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single applicationDate with the authorization filter applied", async () => {
      const applicationDate = { applicationId: "application-1" } as PrismaApplicationDate;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectApplicationDate).mockResolvedValueOnce(applicationDate);

      const result = await getApplicationDate(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectApplicationDate).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationDate);
    });

    it("passes transaction client to selectApplicationDate if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getApplicationDate(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationDate).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyApplicationDates", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyApplicationDates(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationDates).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many applicationDates with the authorization filter applied", async () => {
      const applicationDates = [
        { application: "application-1" },
        { applicationId: "application-2" },
      ] as PrismaApplicationDate[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyApplicationDates).mockResolvedValueOnce(applicationDates);

      const result = await getManyApplicationDates(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyApplicationDates).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationDates);
    });

    it("passes transaction client to selectManyApplicationDates if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyApplicationDates(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationDates).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
