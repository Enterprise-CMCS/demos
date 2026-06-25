import { beforeEach, describe, expect, it, vi } from "vitest";
import { createExtension } from "./createExtension";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types";
import { Prisma } from "@prisma/client";

const testDemonstrationId = "518aa497-d547-422e-95a0-02076c7f7698";
const testExtensionName = "The Extension";
const testExtensionTypeId: ApplicationType = "Extension";
const testExtensionStatusId: ApplicationStatus = "Pre-Submission";
const testExtensionPhaseId: PhaseName = "Concept";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  validateCreateExtensionInput: vi.fn(),
}));

import { prisma } from "../../prismaClient";

describe("createExtension", () => {
  const transactionMocks = {
    application: {
      create: vi.fn(),
    },
    extension: {
      create: vi.fn(),
    },
  };

  const mockTransaction = {
    application: {
      create: transactionMocks.application.create,
    },
    extension: {
      create: transactionMocks.extension.create,
    },
  };

  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testExtensionId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testExtensionDescription = "A description of an extension";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should create an application and an extension in a transaction", async () => {
    transactionMocks.application.create.mockResolvedValueOnce({
      id: testExtensionId,
      applicationTypeId: testExtensionTypeId,
    });
    const testInput: Pick<
      Prisma.ExtensionUncheckedCreateInput,
      "demonstrationId" | "name" | "description" | "signatureLevelId"
    > = {
      demonstrationId: testDemonstrationId,
      name: testExtensionName,
      description: testExtensionDescription,
      signatureLevelId: "OA",
    };
    const expectedCalls = [
      {
        data: {
          applicationTypeId: testExtensionTypeId,
        },
      },
      {
        data: {
          id: testExtensionId,
          applicationTypeId: testExtensionTypeId,
          demonstrationId: testDemonstrationId,
          name: testExtensionName,
          description: testExtensionDescription,
          statusId: testExtensionStatusId,
          currentPhaseId: testExtensionPhaseId,
          demonstrationStatusId: "Approved" satisfies ApplicationStatus,
          signatureLevelId: "OA",
        },
      },
    ];
    await createExtension(testInput);
    expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
    expect(transactionMocks.extension.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
  });

  it.each(["OA", "OCD"] as const)(
    "allows valid signature level %s during creation",
    async (signatureLevel) => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testExtensionId,
        applicationTypeId: testExtensionTypeId,
      });

      await createExtension({
        demonstrationId: testDemonstrationId,
        name: testExtensionName,
        description: testExtensionDescription,
        signatureLevelId: signatureLevel,
      });

      expect(transactionMocks.application.create).toHaveBeenCalledOnce();
      expect(transactionMocks.extension.create).toHaveBeenCalledOnce();
    }
  );
});
