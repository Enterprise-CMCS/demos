import {
  Prisma,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import {
  getDeliverableDemonstrationType,
  getManyDeliverableDemonstrationTypes,
} from "./deliverableDemonstrationTypeData";
import {
  type DeliverableDemonstrationTypeQueryResult,
  selectDeliverableDemonstrationType,
  selectManyDeliverableDemonstrationTypes,
} from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectDeliverableDemonstrationType: vi.fn(),
  selectManyDeliverableDemonstrationTypes: vi.fn(),
}));

describe("deliverableDemonstrationTypeData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View DeliverableDemonstrationTypes on Assigned Demonstrations"],
  };

  const where: Prisma.DeliverableDemonstrationTypeWhereInput = {
    demonstrationId: "demonstration-1",
  };

  const authorizedWhereClause: Prisma.DeliverableDemonstrationTypeWhereInput = {
    demonstrationId: "abc123",
  };

  const authFilter = {
    OR: [authorizedWhereClause],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDeliverableDemonstrationType", () => {
    it("returns null when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getDeliverableDemonstrationType(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDeliverableDemonstrationType).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("queries for a single deliverableDemonstrationType with the authorization filter applied", async () => {
      const deliverableDemonstrationType = {
        demonstrationTypeTagAssignment: {
          tagNameId: "Student Lunch",
          tag: {
            statusId: "Approved",
          },
        },
      } as DeliverableDemonstrationTypeQueryResult;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDeliverableDemonstrationType).mockResolvedValueOnce(
        deliverableDemonstrationType
      );

      const result = await getDeliverableDemonstrationType(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDeliverableDemonstrationType).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(deliverableDemonstrationType);
    });

    it("passes transaction client to selectDeliverableDemonstrationType if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getDeliverableDemonstrationType(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDeliverableDemonstrationType).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDeliverableDemonstrationTypes", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDeliverableDemonstrationTypes(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDeliverableDemonstrationTypes).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many deliverableDemonstrationTypes with the authorization filter applied", async () => {
      const deliverableDemonstrationTypes = [
        {
          demonstrationTypeTagAssignment: {
            tagNameId: "Storm Shelters",
            tag: {
              statusId: "Approved",
            },
          },
        },
        {
          demonstrationTypeTagAssignment: {
            tagNameId: "Student Lunch",
            tag: {
              statusId: "Unapproved",
            },
          },
        },
      ] as DeliverableDemonstrationTypeQueryResult[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDeliverableDemonstrationTypes).mockResolvedValueOnce(
        deliverableDemonstrationTypes
      );

      const result = await getManyDeliverableDemonstrationTypes(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(deliverableDemonstrationTypes);
    });

    it("passes transaction client to selectManyDeliverableDemonstrationTypes if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDeliverableDemonstrationTypes(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDeliverableDemonstrationTypes).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
