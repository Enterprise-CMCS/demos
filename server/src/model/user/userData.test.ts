import { User as PrismaUser, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getUser, getManyUsers } from "./userData";
import { selectUser, selectManyUsers } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectUser: vi.fn(),
  selectManyUsers: vi.fn(),
}));

describe("userData", () => {
  const contextUser: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View My User"],
  };

  const where: Prisma.UserWhereInput = {
    id: "user-1",
  };

  const authorizedWhereClause: Prisma.UserWhereInput = {
    id: "user-1",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUser", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getUser(where, contextUser);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectUser).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single user with the authorization filter applied", async () => {
      const user = { id: "user-1" } as PrismaUser;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectUser).mockResolvedValueOnce(user);

      const result = await getUser(where, contextUser);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(contextUser, expect.any(Function));
      expect(selectUser).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(user);
    });

    it("passes transaction client to selectUser if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getUser(where, contextUser, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectUser).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyUsers", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyUsers(where, contextUser);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyUsers).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many users with the authorization filter applied", async () => {
      const users = [{ id: "user-1" }, { id: "user-2" }] as PrismaUser[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyUsers).mockResolvedValueOnce(users);

      const result = await getManyUsers(where, contextUser);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(contextUser, expect.any(Function));
      expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(users);
    });

    it("passes transaction client to selectManyUsers if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyUsers(where, contextUser, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyUsers).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
