import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../prismaClient.js";
import { createExtensionService } from "./extensionService.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

describe("extensionService", () => {
  const extensionMocks = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  };

  const mockPrismaClient = {
    extension: extensionMocks,
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
    const service = createExtensionService(user);
    await service.get({ id: "extension-1" });
    expect(extensionMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "extension-1" },
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
    const service = createExtensionService(user);
    await service.getMany();
    expect(extensionMocks.findMany).toHaveBeenCalledWith({
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
      permissions: ["View All Extensions", "View Extensions on Assigned Demonstrations"],
    };
    const service = createExtensionService(user);
    await service.get({ id: "extension-1" });
    expect(extensionMocks.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: "extension-1" },
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
