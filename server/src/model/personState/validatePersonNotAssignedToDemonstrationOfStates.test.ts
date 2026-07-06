import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePersonNotAssignedToDemonstrationOfStates } from "./validatePersonNotAssignedToDemonstrationOfStates";
import { selectManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment/queries";

vi.mock("../demonstrationRoleAssignment/queries", () => ({
  selectManyDemonstrationRoleAssignments: vi.fn(),
}));

describe("validatePersonNotAssignedToDemonstrationOfStates", () => {
  const testPersonId = "person-123-456";
  const testStateIds = ["NY", "CA"];
  const mockTransaction = "Test!" as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined if the person is not assigned to demonstrations of the states", async () => {
    vi.mocked(selectManyDemonstrationRoleAssignments).mockResolvedValue([] as never);

    await expect(
      validatePersonNotAssignedToDemonstrationOfStates(testPersonId, testStateIds, mockTransaction)
    ).resolves.toBeUndefined();
    expect(selectManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
      {
        personId: testPersonId,
        stateId: {
          in: testStateIds,
        },
      },
      mockTransaction
    );
  });

  it("should return an error message if the person is assigned to demonstrations of the states", async () => {
    vi.mocked(selectManyDemonstrationRoleAssignments).mockResolvedValue([
      { stateId: "NY" },
      { stateId: "CA" },
    ] as never);

    await expect(
      validatePersonNotAssignedToDemonstrationOfStates(testPersonId, testStateIds, mockTransaction)
    ).resolves.toBe(
      `Cannot unassign states NY, CA from person ${testPersonId} because they are assigned to demonstrations belonging to them.`
    );
    expect(selectManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
      {
        personId: testPersonId,
        stateId: {
          in: testStateIds,
        },
      },
      mockTransaction
    );
  });
});
