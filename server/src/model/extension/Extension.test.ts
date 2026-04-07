import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter } from "../../auth/buildAuthorizationFilter.js";
import { ContextUser } from "../../auth/auth.util.js";
import { getExtension, getManyExtensions } from "./Extension.js";
import { queryExtension } from "./queries/queryExtension.js";
import { queryManyExtensions } from "./queries/queryManyExtensions.js";

vi.mock("../../auth/buildAuthorizationFilter.js", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries/queryExtension.js", () => ({
  queryExtension: vi.fn(),
}));

vi.mock("./queries/queryManyExtensions.js", () => ({
  queryManyExtensions: vi.fn(),
}));

describe("Extension", () => {
  const user: ContextUser = {
    id: "user-1",
    sub: "sub-1",
    role: "demos-state-user",
    permissions: ["View Extensions on Assigned Demonstrations"],
  };

  const where: Prisma.ExtensionWhereInput = {
    id: "extension-1",
  };

  const authorizedWhereClause: Prisma.ExtensionWhereInput = {
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

  describe("getExtension", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getExtension(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryExtension).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single extension with the authorization filter applied", async () => {
      const extension = { id: "extension-1" } as PrismaExtension;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryExtension).mockResolvedValueOnce(extension);

      const result = await getExtension(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryExtension).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(extension);
    });
  });

  describe("getManyExtensions", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyExtensions(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(queryManyExtensions).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many extensions with the authorization filter applied", async () => {
      const extensions = [{ id: "extension-1" }, { id: "extension-2" }] as PrismaExtension[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(queryManyExtensions).mockResolvedValueOnce(extensions);

      const result = await getManyExtensions(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(queryManyExtensions).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(extensions);
    });
  });
});
