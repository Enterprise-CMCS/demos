import { ApplicationTagSuggestion as PrismaApplicationTagSuggestion, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import {
  getApplicationTagSuggestion,
  getManyApplicationTagSuggestions,
} from "./applicationTagSuggestionData";
import { selectApplicationTagSuggestion, selectManyApplicationTagSuggestions } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectApplicationTagSuggestion: vi.fn(),
  selectManyApplicationTagSuggestions: vi.fn(),
}));

describe("applicationTagSuggestionData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View ApplicationTagSuggestions on Assigned Demonstrations"],
  };

  const where: Prisma.ApplicationTagSuggestionWhereInput = {
    applicationId: "application-1",
  };

  const authorizedWhereClause: Prisma.ApplicationTagSuggestionWhereInput = {
    applicationId: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApplicationTagSuggestion", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getApplicationTagSuggestion(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationTagSuggestion).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single applicationTagSuggestion with the authorization filter applied", async () => {
      const applicationTagSuggestion = {
        value: "Student Lunch",
      } as PrismaApplicationTagSuggestion;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectApplicationTagSuggestion).mockResolvedValueOnce(applicationTagSuggestion);

      const result = await getApplicationTagSuggestion(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectApplicationTagSuggestion).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationTagSuggestion);
    });

    it("passes transaction client to selectApplicationTagSuggestion if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getApplicationTagSuggestion(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationTagSuggestion).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyApplicationTagSuggestions", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyApplicationTagSuggestions(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationTagSuggestions).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many applicationTagSuggestions with the authorization filter applied", async () => {
      const applicationTagSuggestions = [
        { value: "Student Lunch" },
        { value: "City Park Funding" },
      ] as PrismaApplicationTagSuggestion[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyApplicationTagSuggestions).mockResolvedValueOnce(
        applicationTagSuggestions
      );

      const result = await getManyApplicationTagSuggestions(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyApplicationTagSuggestions).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationTagSuggestions);
    });

    it("passes transaction client to selectManyApplicationTagSuggestions if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyApplicationTagSuggestions(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationTagSuggestions).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
