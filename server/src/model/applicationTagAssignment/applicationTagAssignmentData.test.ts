import { ApplicationTagAssignment as PrismaApplicationTagAssignment, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import {
  getApplicationTagAssignment,
  getManyApplicationTagAssignments,
} from "./applicationTagAssignmentData";
import {
  type ApplicationTagAssignmentQueryResult,
  selectApplicationTagAssignment,
  selectManyApplicationTagAssignments,
} from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectApplicationTagAssignment: vi.fn(),
  selectManyApplicationTagAssignments: vi.fn(),
}));

describe("applicationTagAssignmentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View ApplicationTagAssignments on Assigned Demonstrations"],
  };

  const where: Prisma.ApplicationTagAssignmentWhereInput = {
    applicationId: "application-1",
  };

  const authorizedWhereClause: Prisma.ApplicationTagAssignmentWhereInput = {
    applicationId: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApplicationTagAssignment", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getApplicationTagAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationTagAssignment).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single applicationTagAssignment with the authorization filter applied", async () => {
      const applicationTagAssignment = {
        tagNameId: "Student Lunch",
      } as ApplicationTagAssignmentQueryResult;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectApplicationTagAssignment).mockResolvedValueOnce(applicationTagAssignment);

      const result = await getApplicationTagAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectApplicationTagAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationTagAssignment);
    });

    it("passes transaction client to selectApplicationTagAssignment if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getApplicationTagAssignment(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectApplicationTagAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyApplicationTagAssignments", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyApplicationTagAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationTagAssignments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many applicationTagAssignments with the authorization filter applied", async () => {
      const applicationTagAssignments = [
        { tagNameId: "Pet Insurance" },
        { tagNameId: "Public Transit" },
      ] as ApplicationTagAssignmentQueryResult[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyApplicationTagAssignments).mockResolvedValueOnce(
        applicationTagAssignments
      );

      const result = await getManyApplicationTagAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyApplicationTagAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(applicationTagAssignments);
    });

    it("passes transaction client to selectManyApplicationTagAssignments if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyApplicationTagAssignments(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyApplicationTagAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
