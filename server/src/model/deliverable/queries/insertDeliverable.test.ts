// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";

// Types
import { DeliverableType, PersonType } from "../../../types.js";
import { ParsedCreateDeliverableInput } from "..";

// Functions under test
import { insertDeliverable } from "./insertDeliverable";

// Mock imports
vi.mock("../../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

import { prisma } from "../../../prismaClient.js";

describe("insertDeliverable", () => {
  const testPersonTypeId: PersonType = "demos-cms-user";
  const regularMocks = {
    deliverable: {
      create: vi.fn(),
    },
    user: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockPrismaClient = {
    deliverable: {
      create: regularMocks.deliverable.create,
    },
    user: {
      findUniqueOrThrow: regularMocks.user.findUniqueOrThrow,
    },
  };

  const transactionMocks = {
    deliverable: {
      create: vi.fn(),
    },
    user: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    deliverable: {
      create: transactionMocks.deliverable.create,
    },
    user: {
      findUniqueOrThrow: transactionMocks.user.findUniqueOrThrow,
    },
  } as any;

  const testInput: ParsedCreateDeliverableInput = {
    name: "A test name",
    deliverableType: "Close Out Report" satisfies DeliverableType,
    demonstrationId: "7cd6cd0f-e3de-47a0-9faa-32343020c955",
    cmsOwnerUserId: "55e96e14-ec93-490b-b8b4-19d18ca27f38",
    dueDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 2, 14, 3, 17, 22, 931, "America/New_York"),
    },
    demonstrationTypes: [],
  };
  const expectedFindCall = {
    where: {
      id: testInput.cmsOwnerUserId,
    },
    select: {
      personTypeId: true,
    },
  };
  const expectedCreateCall = {
    data: {
      deliverableTypeId: testInput.deliverableType,
      name: testInput.name,
      demonstrationId: testInput.demonstrationId,
      demonstrationStatusId: "Approved",
      statusId: "Upcoming",
      cmsOwnerUserId: testInput.cmsOwnerUserId,
      cmsOwnerPersonTypeId: testPersonTypeId,
      dueDate: testInput.dueDate.easternTZDate,
      dueDateTypeId: "Normal",
      expectedToBeSubmitted: true,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    regularMocks.user.findUniqueOrThrow.mockReturnValue({ personTypeId: testPersonTypeId });
    transactionMocks.user.findUniqueOrThrow.mockReturnValue({ personTypeId: testPersonTypeId });
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
  });

  it("should insert the new deliverable using a new client if no transaction is given", async () => {
    await insertDeliverable(testInput);
    expect(regularMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(expectedFindCall);
    expect(regularMocks.deliverable.create).toHaveBeenCalledExactlyOnceWith(expectedCreateCall);
    expect(transactionMocks.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(transactionMocks.deliverable.create).not.toHaveBeenCalled();
  });

  it("should insert the deliverable via a transaction if one is given", async () => {
    await insertDeliverable(testInput, mockTransaction);
    expect(regularMocks.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(regularMocks.deliverable.create).not.toHaveBeenCalled();
    expect(transactionMocks.user.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedFindCall
    );
    expect(transactionMocks.deliverable.create).toHaveBeenCalledExactlyOnceWith(expectedCreateCall);
  });
});
