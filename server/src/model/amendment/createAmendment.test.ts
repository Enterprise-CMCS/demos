import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAmendment } from "./createAmendment";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types";
import { Prisma } from "@prisma/client";

const testDemonstrationId = "518aa497-d547-422e-95a0-02076c7f7698";
const testAmendmentName = "The Amendment";
const testAmendmentTypeId: ApplicationType = "Amendment";
const testAmendmentStatusId: ApplicationStatus = "Pre-Submission";
const testAmendmentPhaseId: PhaseName = "Concept";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  validateCreateAmendmentInput: vi.fn(),
}));

import { prisma } from "../../prismaClient";

describe("createAmendment", () => {
  const transactionMocks = {
    application: {
      create: vi.fn(),
    },
    amendment: {
      create: vi.fn(),
    },
  };

  const mockTransaction = {
    application: {
      create: transactionMocks.application.create,
    },
    amendment: {
      create: transactionMocks.amendment.create,
    },
  };

  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testAmendmentId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testAmendmentDescription = "A description of an amendment";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should create an application and an amendment in a transaction", async () => {
    transactionMocks.application.create.mockResolvedValueOnce({
      id: testAmendmentId,
      applicationTypeId: testAmendmentTypeId,
    });
    const testInput: Pick<
      Prisma.AmendmentUncheckedCreateInput,
      "demonstrationId" | "name" | "description" | "signatureLevelId"
    > = {
      demonstrationId: testDemonstrationId,
      name: testAmendmentName,
      description: testAmendmentDescription,
      signatureLevelId: "OA",
    };
    const expectedCalls = [
      {
        data: {
          applicationTypeId: testAmendmentTypeId,
        },
      },
      {
        data: {
          id: testAmendmentId,
          applicationTypeId: testAmendmentTypeId,
          demonstrationId: testDemonstrationId,
          name: testAmendmentName,
          description: testAmendmentDescription,
          statusId: testAmendmentStatusId,
          currentPhaseId: testAmendmentPhaseId,
          demonstrationStatusId: "Approved" satisfies ApplicationStatus,
          signatureLevelId: "OA",
        },
      },
    ];
    await createAmendment(testInput);
    expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
    expect(transactionMocks.amendment.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
  });

  it.each(["OA", "OCD"] as const)(
    "allows valid signature level %s during creation",
    async (signatureLevel) => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testAmendmentId,
        applicationTypeId: testAmendmentTypeId,
      });

      await createAmendment({
        demonstrationId: testDemonstrationId,
        name: testAmendmentName,
        description: testAmendmentDescription,
        signatureLevelId: signatureLevel,
      });

      expect(transactionMocks.application.create).toHaveBeenCalledOnce();
      expect(transactionMocks.amendment.create).toHaveBeenCalledOnce();
    }
  );
});
