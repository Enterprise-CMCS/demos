// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { DeliverableAction, DeliverableActionType } from "../../types";

// Functions under test
import { getFormattedDeliverableActions } from "./getFormattedDeliverableActions";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  formatDeliverableAction: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectManyDeliverableActions: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { formatDeliverableAction } from ".";
import { SelectDeliverableActionRowResult, selectManyDeliverableActions } from "./queries";

describe("getFormattedDeliverableActions", () => {
  // Test inputs
  const testDeliverableId = "cd6eb22a-69ce-4ee5-8d32-a9074f5ad4d6";

  // Mock return values
  const mockPrismaClient = "I'm a returned client!" as any;
  const mockTransaction = "I'm a transaction!" as any;
  const testTimestamp = new Date(2026, 3, 23, 20, 20, 39, 131);
  const mockQueryResults: DeepPartial<SelectDeliverableActionRowResult>[] = [
    {
      id: "eafccca7-9b92-435d-8069-d065dbc52d0a",
      actionTimestamp: testTimestamp,
      actionTypeId: "Manually Changed Due Date" satisfies DeliverableActionType,
    },
    {
      id: "6a43bc82-02e2-419b-8ecb-88805e741766",
      actionTimestamp: testTimestamp,
      actionTypeId: "Manually Changed Due Date" satisfies DeliverableActionType,
    },
  ];
  const mockFormatted: DeliverableAction[] = [
    {
      id: "eafccca7-9b92-435d-8069-d065dbc52d0a",
      actionTimestamp: testTimestamp,
      actionType: "Manually Changed Due Date",
      details: "These are test details!",
      userFullName: "John McUserson (CMS User)",
    },
    {
      id: "6a43bc82-02e2-419b-8ecb-88805e741766",
      actionTimestamp: testTimestamp,
      actionType: "Manually Changed Due Date",
      details: "These are other test details!",
      userFullName: "Jane State (State User)",
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient);
    vi.mocked(formatDeliverableAction).mockReturnValueOnce(mockFormatted[0]);
    vi.mocked(formatDeliverableAction).mockReturnValueOnce(mockFormatted[1]);
    vi.mocked(selectManyDeliverableActions).mockResolvedValue(
      mockQueryResults as SelectDeliverableActionRowResult[]
    );
  });

  it("should query the actions using a new client if one is not provided", async () => {
    await getFormattedDeliverableActions(testDeliverableId);
    expect(selectManyDeliverableActions).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockPrismaClient
    );
  });

  it("should query the actions using an existing client if one is provided", async () => {
    await getFormattedDeliverableActions(testDeliverableId, mockTransaction);
    expect(selectManyDeliverableActions).toHaveBeenCalledExactlyOnceWith(
      { deliverableId: testDeliverableId },
      mockTransaction
    );
  });

  it("should format each query result via formatDeliverableAction", async () => {
    await getFormattedDeliverableActions(testDeliverableId, mockTransaction);
    expect(vi.mocked(formatDeliverableAction).mock.calls).toStrictEqual([
      [mockQueryResults[0]],
      [mockQueryResults[1]],
    ]);
  });

  it("should format the results and return them", async () => {
    const results = await getFormattedDeliverableActions(testDeliverableId, mockTransaction);
    expect(results).toStrictEqual(mockFormatted);
  });
});
