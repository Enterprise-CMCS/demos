import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getExtension, getManyExtensions } from "./extensionData";
import { selectExtension, selectManyExtensions } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectExtension: vi.fn(),
  selectManyExtensions: vi.fn(),
}));

describe("extensionData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
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
      expect(selectExtension).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single extension with the authorization filter applied", async () => {
      const extension = { id: "extension-1" } as PrismaExtension;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectExtension).mockResolvedValueOnce(extension);

      const result = await getExtension(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectExtension).toHaveBeenCalledExactlyOnceWith({
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
      expect(selectManyExtensions).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many extensions with the authorization filter applied", async () => {
      const extensions = [{ id: "extension-1" }, { id: "extension-2" }] as PrismaExtension[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyExtensions).mockResolvedValueOnce(extensions);

      const result = await getManyExtensions(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyExtensions).toHaveBeenCalledExactlyOnceWith({
        AND: [where, authFilter],
      });
      expect(result).toBe(extensions);
    });
  });
});
