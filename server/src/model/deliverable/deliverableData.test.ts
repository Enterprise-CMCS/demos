import { Deliverable as PrismaDeliverable, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationFilter, ContextUser } from "../../auth";
import { log } from "../../log";
import { getDeliverable, getManyDeliverables } from "./deliverableData";
import { selectDeliverable, selectManyDeliverables } from "./queries";

vi.mock("../../auth", () => ({
  buildAuthorizationFilter: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    warn: vi.fn(),
  },
}));

vi.mock("./queries", () => ({
  selectDeliverable: vi.fn(),
  selectManyDeliverables: vi.fn(),
}));

describe("./deliverableData", () => {
  const user: ContextUser = {
    id: "user-1",
    cognitoSubject: "sub-1",
    personTypeId: "demos-state-user",
    permissions: ["View Deliverables on Assigned Demonstrations"],
  };

  const where: Prisma.DeliverableWhereInput = {
    id: "deliverable-1",
  };

  const authorizedWhereClause: Prisma.DeliverableWhereInput = {
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

  describe("getDeliverable", () => {
    it("throws not found error when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);
      vi.mocked(selectDeliverable).mockResolvedValueOnce(null);

      await expect(getDeliverable(where, user)).rejects.toThrow(
        "Requested Deliverable not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith(where, undefined);
    });

    it("throws not found error when deliverable is not found even if auth filter is applied", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDeliverable).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      await expect(getDeliverable(where, user)).rejects.toThrow(
        "Requested Deliverable not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledExactlyOnceWith(user, expect.any(Function));

      expect(selectDeliverable).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDeliverable).toHaveBeenNthCalledWith(2, where, undefined);
    });

    it("logs a warning and throws not found error when deliverable is found but user does not have permission to view it", async () => {
      const deliverable = { id: "deliverable-1" } as PrismaDeliverable;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDeliverable).mockResolvedValueOnce(null).mockResolvedValueOnce(deliverable);

      await expect(getDeliverable(where, user)).rejects.toThrow(
        "Requested Deliverable not found or User does not have Permission to view it."
      );

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDeliverable).toHaveBeenNthCalledWith(
        1,
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(selectDeliverable).toHaveBeenNthCalledWith(2, where, undefined);
      expect(log.warn).toHaveBeenCalledExactlyOnceWith(
        `User ${user.id} attempted to access Deliverable ${deliverable.id} without sufficient permissions.`
      );
    });

    it("returns the deliverable when found and user has permission to view it", async () => {
      const deliverable = { id: "deliverable-1" } as PrismaDeliverable;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectDeliverable).mockResolvedValueOnce(deliverable);

      const result = await getDeliverable(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(deliverable);
    });

    it("passes transaction client to selectDeliverable if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      const deliverable = { id: "deliverable-1" } as PrismaDeliverable;
      vi.mocked(selectDeliverable).mockResolvedValueOnce(deliverable);

      await getDeliverable(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectDeliverable).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });

  describe("getManyDeliverables", () => {
    it("returns an empty array when authorization filter returns null", async () => {
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(null);

      const result = await getManyDeliverables(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDeliverables).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("queries for many deliverables with the authorization filter applied", async () => {
      const deliverables = [
        { id: "deliverable-1" },
        { id: "deliverable-2" },
      ] as PrismaDeliverable[];
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);
      vi.mocked(selectManyDeliverables).mockResolvedValueOnce(deliverables);

      const result = await getManyDeliverables(where, user);

      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(buildAuthorizationFilter).toHaveBeenCalledWith(user, expect.any(Function));
      expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        undefined
      );
      expect(result).toBe(deliverables);
    });

    it("passes transaction client to selectManyDeliverables if provided", async () => {
      const mockTransactionClient = {} as any;
      vi.mocked(buildAuthorizationFilter).mockReturnValueOnce(authFilter);

      await getManyDeliverables(where, user, mockTransactionClient);
      expect(buildAuthorizationFilter).toHaveBeenCalledOnce();
      expect(selectManyDeliverables).toHaveBeenCalledExactlyOnceWith(
        {
          AND: [where, authFilter],
        },
        mockTransactionClient
      );
    });
  });
});
