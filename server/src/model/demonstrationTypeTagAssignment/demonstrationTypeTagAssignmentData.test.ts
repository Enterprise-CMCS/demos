import { DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import {
  getDemonstrationTypeTagAssignment,
  getManyDemonstrationTypeTagAssignments,
} from "./demonstrationTypeTagAssignmentData";
import {
  type DemonstrationTypeTagAssignmentQueryResult,
  selectDemonstrationTypeTagAssignment,
  selectManyDemonstrationTypeTagAssignments,
} from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDemonstrationTypeTagAssignment: vi.fn(),
  selectManyDemonstrationTypeTagAssignments: vi.fn(),
}));

describe("demonstrationTypeTagAssignmentData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View DemonstrationTypeTagAssignments on Assigned Demonstrations"],
  };

  const where: Prisma.DemonstrationTypeTagAssignmentWhereInput = {
    demonstrationId: "demonstration-1",
  };

  const authorizedWhereClause: Prisma.DemonstrationTypeTagAssignmentWhereInput = {
    demonstrationId: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDemonstrationTypeTagAssignment", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getDemonstrationTypeTagAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstrationTypeTagAssignment).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single demonstrationTypeTagAssignment with the authorization filter applied", async () => {
      const demonstrationTypeTagAssignment = {
        tagNameId: "Student Lunch",
      } as DemonstrationTypeTagAssignmentQueryResult;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDemonstrationTypeTagAssignment).mockResolvedValueOnce(demonstrationTypeTagAssignment);

      const result = await getDemonstrationTypeTagAssignment(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDemonstrationTypeTagAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstrationTypeTagAssignment);
    });

    it("passes transaction client to selectDemonstrationTypeTagAssignment if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getDemonstrationTypeTagAssignment(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDemonstrationTypeTagAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDemonstrationTypeTagAssignments", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDemonstrationTypeTagAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrationTypeTagAssignments).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many demonstrationTypeTagAssignments with the authorization filter applied", async () => {
      const demonstrationTypeTagAssignments = [
        { tagNameId: "Pet Insurance" },
        { tagNameId: "Public Transit" },
      ] as DemonstrationTypeTagAssignmentQueryResult[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDemonstrationTypeTagAssignments).mockResolvedValueOnce(
        demonstrationTypeTagAssignments
      );

      const result = await getManyDemonstrationTypeTagAssignments(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDemonstrationTypeTagAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(demonstrationTypeTagAssignments);
    });

    it("passes transaction client to selectManyDemonstrationTypeTagAssignments if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDemonstrationTypeTagAssignments(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDemonstrationTypeTagAssignments).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
