import { describe, beforeEach, expect, it, vi } from "vitest";
import { validateStateUserCanUploadStateDocumentToDeliverable } from "./validateStateUserCanUploadStateDocumentToDeliverable";
import { prisma } from "../../prismaClient";
import { DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment } from "@prisma/client";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("validateStateUserCanUploadStateDocumentToDeliverable", () => {
  const regularMocks = {
    demonstrationRoleAssignment: {
      findMany: vi.fn(),
    },
  };

  const mockPrismaClient = {
    demonstrationRoleAssignment: {
      findMany: regularMocks.demonstrationRoleAssignment.findMany,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as never);
  });

  it("should throw an error if the user does not have the State Point of Contact role for the demonstration", async () => {
    vi.mocked(prisma().demonstrationRoleAssignment.findMany).mockResolvedValue([]);

    const userId = "user-id-without-role";
    const demonstrationId = "demonstration-id";

    await expect(
      validateStateUserCanUploadStateDocumentToDeliverable(userId, demonstrationId)
    ).rejects.toThrow("User does not have permission to upload documents to this deliverable.");
  });

  it("should not throw an error if the user has the State Point of Contact role for the demonstration", async () => {
    vi.mocked(prisma().demonstrationRoleAssignment.findMany).mockResolvedValue([
      {
        personId: "user-id-with-role",
        roleId: "State Point of Contact",
        demonstrationId: "demonstration-id",
      } as PrismaDemonstrationRoleAssignment,
    ]);

    const userId = "user-id-with-role";
    const demonstrationId = "demonstration-id";

    await expect(
      validateStateUserCanUploadStateDocumentToDeliverable(userId, demonstrationId)
    ).resolves.not.toThrow();
  });
});
