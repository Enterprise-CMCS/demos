import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../prismaClient.js";
import { createAmendmentService } from "./amendmentService.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("amendmentService", () => {
  const amendmentMocks = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };

  const mockPrismaClient = {
    amendment: amendmentMocks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("blocks get when no permissions provided", async () => {
    const user = {
      id: "test-user-id",
      sub: "test-sub",
      role: "demos-admin",
      permissions: [],
    };
    const service = createAmendmentService(user);
    await service.get({ id: "amendment-1" });
    expect(amendmentMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "amendment-1" },
          {
            OR: [
              {
                id: {
                  in: [],
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("blocks getMany when no permissions provided", async () => {
    const user = {
      id: "test-user-id",
      sub: "test-sub",
      role: "demos-admin",
      permissions: [],
    };
    const service = createAmendmentService(user);
    await service.getMany();
    expect(amendmentMocks.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {},
          {
            OR: [
              {
                id: {
                  in: [],
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("builds where clause from permissions", async () => {
    const user = {
      id: "test-user-id",
      sub: "test-sub",
      role: "demos-admin",
      permissions: ["View All Amendments", "View Amendments on Assigned Demonstrations"],
    };
    const service = createAmendmentService(user);
    await service.get({ id: "amendment-1" });
    expect(amendmentMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "amendment-1" },
          {
            OR: [
              {
                id: {
                  in: [],
                },
              },
              {
                NOT: {
                  id: {
                    in: [],
                  },
                },
              },
              {
                demonstration: {
                  demonstrationRoleAssignments: {
                    some: {
                      personId: user.id,
                      roleId: "State Point of Contact",
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    });
  });
});
