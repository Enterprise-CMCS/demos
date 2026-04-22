import {
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Prisma,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import {
  getDemonstrationRoleAssignment,
  getManyDemonstrationRoleAssignments,
} from "./demonstrationRoleAssignmentData";
import {
  type DemonstrationRoleAssignmentQueryResult,
  selectDemonstrationRoleAssignment,
  selectManyDemonstrationRoleAssignments,
} from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDemonstrationRoleAssignment: vi.fn(),
  selectManyDemonstrationRoleAssignments: vi.fn(),
}));

describe("demonstrationRoleAssignmentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View DemonstrationRoleAssignments on Assigned Demonstrations"],
  };

  const where: Prisma.DemonstrationRoleAssignmentWhereInput = {
    demonstrationId: "demonstration-1",
  };

  const authorizedWhereClause: Prisma.DemonstrationRoleAssignmentWhereInput = {
    demonstrationId: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDemonstrationRoleAssignment", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getDemonstrationRoleAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstrationRoleAssignment).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single demonstrationRoleAssignment with the authorization filter applied", async () => {
      const demonstrationRoleAssignment = {
        demonstrationId: "abc123",
      } as DemonstrationRoleAssignmentQueryResult;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDemonstrationRoleAssignment).mockResolvedValueOnce(
        demonstrationRoleAssignment
      );

      const result = await getDemonstrationRoleAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDemonstrationRoleAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstrationRoleAssignment);
    });

    it("passes transaction client to selectDemonstrationRoleAssignment if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getDemonstrationRoleAssignment(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstrationRoleAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDemonstrationRoleAssignments", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDemonstrationRoleAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrationRoleAssignments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many demonstrationRoleAssignments with the authorization filter applied", async () => {
      const demonstrationRoleAssignments = [
        { demonstrationId: "abc123" },
        { demonstrationId: "def456" },
      ] as DemonstrationRoleAssignmentQueryResult[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDemonstrationRoleAssignments).mockResolvedValueOnce(
        demonstrationRoleAssignments
      );

      const result = await getManyDemonstrationRoleAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstrationRoleAssignments);
    });

    it("passes transaction client to selectManyDemonstrationRoleAssignments if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDemonstrationRoleAssignments(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
