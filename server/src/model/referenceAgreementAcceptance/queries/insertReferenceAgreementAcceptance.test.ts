// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types

// Functions under test
import { insertReferenceAgreementAcceptance } from "./insertReferenceAgreementAcceptance";

// Mock imports
vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));
import { prisma } from "../../../prismaClient";

describe("insertReferenceAgreementAcceptance", () => {
  const testInput = {
    referenceId: "reference-1",
    referenceAgreementId: "reference-agreement-1",
    userId: "user-1",
  };

  const regularMocks = {
    referenceAgreementAcceptance: {
      create: vi.fn(),
    },
  };
  const mockPrismaClient = {
    referenceAgreementAcceptance: {
      create: regularMocks.referenceAgreementAcceptance.create,
    },
  };
  const transactionMocks = {
    referenceAgreementAcceptance: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    referenceAgreementAcceptance: {
      create: transactionMocks.referenceAgreementAcceptance.create,
    },
  } as any;

  const expectedCall = {
    data: testInput,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert using a new client if no transaction is given", async () => {
    await insertReferenceAgreementAcceptance(testInput);
    expect(prisma).toHaveBeenCalledOnce();
    expect(regularMocks.referenceAgreementAcceptance.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
    expect(transactionMocks.referenceAgreementAcceptance.create).not.toHaveBeenCalled();
  });

  it("should insert using an existing client if provided", async () => {
    await insertReferenceAgreementAcceptance(testInput, mockTransaction);
    expect(prisma).not.toHaveBeenCalled();
    expect(regularMocks.referenceAgreementAcceptance.create).not.toHaveBeenCalled();
    expect(transactionMocks.referenceAgreementAcceptance.create).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
