import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "./demonstrationRoleAssignmentData";
import {
  DemonstrationRoleAssignmentQueryResult,
  selectManyDemonstrationRoleAssignments,
} from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDemonstrationRoleAssignment: vi.fn(),
  selectManyDemonstrationRoleAssignments: vi.fn(),
}));

describe("./demonstrationRoleAssignmentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View DemonstrationRoleAssignments on Assigned Demonstrations"],
  };

  const where: Prisma.DemonstrationRoleAssignmentWhereInput = {
    personId: "demonstrationRoleAssignment-1",
  };

  const authorizedWhereClause: Prisma.DemonstrationRoleAssignmentWhereInput = {
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
        { personId: "demonstrationRoleAssignment-1" },
        { personId: "demonstrationRoleAssignment-2" },
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
