import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../prismaClient.js";
import { createDemonstrationService } from "./demonstrationService.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("demonstrationService", () => {
  const demonstrationMocks = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };

  const mockPrismaClient = {
    demonstration: demonstrationMocks,
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
    const service = createDemonstrationService(user);
    await service.get({ id: "demo-1" });
    expect(demonstrationMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "demo-1" },
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
    const service = createDemonstrationService(user);
    await service.getMany();
    expect(demonstrationMocks.findMany).toHaveBeenCalledWith({
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
      permissions: ["View All Demonstrations", "View Assigned Demonstrations"],
    };
    const service = createDemonstrationService(user);
    await service.get({ id: "demo-1" });
    expect(demonstrationMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "demo-1" },
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
                demonstrationRoleAssignments: {
                  some: {
                    personId: user.id,
                    roleId: "State Point of Contact",
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
