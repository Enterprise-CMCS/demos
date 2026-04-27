// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { SelectManyDeliverableActionsRowResult } from "./queries";
import { DeliverableActionType } from "../../types";

// Functions under test
import { getFormattedDeliverableActions } from "./getFormattedDeliverableActions";

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  formatDetailsMessage: vi.fn(),
  formatFullUserName: vi.fn(),
}));

vi.mock("./queries", () => ({
  selectManyDeliverableActions: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { formatDetailsMessage, formatFullUserName } from ".";
import { selectManyDeliverableActions } from "./queries";

describe("selectManyDeliverableActions", () => {
  // Test inputs
  const testDeliverableId = "cd6eb22a-69ce-4ee5-8d32-a9074f5ad4d6";

  // Mock return values
  const mockPrismaClient = "I'm a returned client!" as any;
  const mockTransaction = "I'm a transaction!" as any;
  const mockQueryResults: DeepPartial<SelectManyDeliverableActionsRowResult>[] = [
    {
      id: "eafccca7-9b92-435d-8069-d065dbc52d0a",
      actionTimestamp: new Date(2026, 3, 23, 20, 20, 39, 131),
      actionTypeId: "Manually Changed Due Date" satisfies DeliverableActionType,
    },
    {
      id: "6a43bc82-02e2-419b-8ecb-88805e741766",
      actionTimestamp: new Date(2026, 3, 23, 20, 20, 39, 131),
      actionTypeId: "Manually Changed Due Date" satisfies DeliverableActionType,
    },
  ];
  const mockDetails = ["These are test details!", "These are other test details!"];
  const mockFullName = ["John McUserson (CMS User)", "Jane State (State User)"];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient);
    vi.mocked(formatDetailsMessage).mockReturnValueOnce(mockDetails[0]);
    vi.mocked(formatDetailsMessage).mockReturnValueOnce(mockDetails[1]);
    vi.mocked(formatFullUserName).mockReturnValueOnce(mockFullName[0]);
    vi.mocked(formatFullUserName).mockReturnValueOnce(mockFullName[1]);
    vi.mocked(selectManyDeliverableActions).mockResolvedValue(
      mockQueryResults as SelectManyDeliverableActionsRowResult[]
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

  it("should call the formatting functions using the result of the query", async () => {
    await getFormattedDeliverableActions(testDeliverableId, mockTransaction);
    expect(vi.mocked(formatDetailsMessage).mock.calls).toStrictEqual([
      [mockQueryResults[0]],
      [mockQueryResults[1]],
    ]);
    expect(vi.mocked(formatFullUserName).mock.calls).toStrictEqual([
      [mockQueryResults[0]],
      [mockQueryResults[1]],
    ]);
  });

  it("should format the results and return them", async () => {
    const results = await getFormattedDeliverableActions(testDeliverableId, mockTransaction);
    expect(results).toStrictEqual([
      {
        id: mockQueryResults[0].id,
        actionTimestamp: mockQueryResults[0].actionTimestamp,
        actionType: mockQueryResults[0].actionTypeId,
        details: "These are test details!",
        userFullName: "John McUserson (CMS User)",
      },
      {
        id: mockQueryResults[1].id,
        actionTimestamp: mockQueryResults[1].actionTimestamp,
        actionType: mockQueryResults[1].actionTypeId,
        details: "These are other test details!",
        userFullName: "Jane State (State User)",
      },
    ]);
  });
});
