import { ApplicationNote as PrismaApplicationNote, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getApplicationNote, getManyApplicationNotes } from "./applicationNoteData";
import { selectApplicationNote, selectManyApplicationNotes } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectApplicationNote: vi.fn(),
  selectManyApplicationNotes: vi.fn(),
}));

describe("./applicationNoteData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View ApplicationNotes on Assigned Demonstrations"],
  };

  const where: Prisma.ApplicationNoteWhereInput = {
    applicationId: "application-1",
  };

  const authorizedWhereClause: Prisma.ApplicationNoteWhereInput = {
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

  describe("getApplicationNote", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getApplicationNote(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationNote).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single applicationNote with the authorization filter applied", async () => {
      const applicationNote = { applicationId: "application-1" } as PrismaApplicationNote;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectApplicationNote).mockResolvedValueOnce(applicationNote);

      const result = await getApplicationNote(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectApplicationNote).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationNote);
    });

    it("passes transaction client to selectApplicationNote if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getApplicationNote(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationNote).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyApplicationNotes", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyApplicationNotes(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationNotes).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many applicationNotes with the authorization filter applied", async () => {
      const applicationNotes = [
        { application: "application-1" },
        { applicationId: "application-2" },
      ] as PrismaApplicationNote[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyApplicationNotes).mockResolvedValueOnce(applicationNotes);

      const result = await getManyApplicationNotes(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyApplicationNotes).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationNotes);
    });

    it("passes transaction client to selectManyApplicationNotes if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyApplicationNotes(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationNotes).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
