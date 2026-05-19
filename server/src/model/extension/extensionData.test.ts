import { Extension as PrismaExtension, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getExtension, getManyExtensions } from "./extensionData";
import { selectExtension, selectManyExtensions } from "./queries";
import { log } from "../../log";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectExtension: vi.fn(),
  selectManyExtensions: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    warn: vi.fn(),
  },
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
    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectExtension).mockResolvedValueOnce(null);

      await expect(getExtension(where, user)).rejects.toThrow(
        "Requested Extension not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectExtension).toHaveBeenCalledExactlyOnceWith(where, undefined);
    });

    it("throws not found error when extension is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectExtension).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(getExtension(where, user)).rejects.toThrow(
        "Requested Extension not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectExtension).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectExtension).toHaveBeenNthCalledWith(2, where, undefined);
    });

    it("logs a warning and throws not found error when extension is found but user does not have permission to view it", async () => {
      const extension = { id: "extension-1" } as PrismaExtension;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectExtension)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(extension);

      await expect(getExtension(where, user)).rejects.toThrow(
        "Requested Extension not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectExtension).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectExtension).toHaveBeenNthCalledWith(2, where, undefined);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to access Extension ${extension.id} without sufficient permissions.`
      );
    });

    it("returns the extension when found and user has permission to view it", async () => {
      const extension = { id: "extension-1" } as PrismaExtension;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectExtension).mockResolvedValueOnce(extension);

      const result = await getExtension(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectExtension).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
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
      expect(selectManyExtensions).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(extensions);
    });

    it("passes transaction client to selectManyExtensions if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyExtensions(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyExtensions).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
