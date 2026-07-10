import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPersonStates } from ".";
import { prisma } from "../../prismaClient";
import { selectPersonOrThrow } from "../person/queries";
import { selectManyStates } from "../state/queries";
import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { deleteManyPersonStates, insertManyPersonStates } from "./queries";
import { checkPersonIsStateUser } from "./checkPersonIsStateUser";
import { checkPersonNotAssignedToDemonstrationOfStates } from "./checkPersonNotAssignedToDemonstrationOfStates";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("../person/queries", () => ({
  selectPersonOrThrow: vi.fn(),
}));

vi.mock("../state/queries", () => ({
  selectManyStates: vi.fn(),
}));

vi.mock("./queries", () => ({
  deleteManyPersonStates: vi.fn(),
  insertManyPersonStates: vi.fn(),
}));

vi.mock("../../errors/cleanErrorsAndThrow", () => ({
  cleanErrorsAndThrow: vi.fn(),
}));

vi.mock("./checkPersonIsStateUser", () => ({
  checkPersonIsStateUser: vi.fn(),
}));

vi.mock("./checkPersonNotAssignedToDemonstrationOfStates", () => ({
  checkPersonNotAssignedToDemonstrationOfStates: vi.fn(),
}));

describe("setPersonStates", () => {
  const mockTransaction = {} as any;
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };
  const testPersonId = "person-123-456";
  const testReturnedPerson = {
    id: testPersonId,
  };
  const validationError = new Error("Validation failed");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(cleanErrorsAndThrow).mockImplementation(() => {
      throw validationError;
    });
  });

  it("should throw if the person is not a state user", async () => {
    const validationMessage = "test validation error";
    vi.mocked(checkPersonIsStateUser).mockResolvedValue(validationMessage);

    await expect(setPersonStates(testPersonId, ["NY"])).rejects.toThrow(validationError);

    expect(checkPersonIsStateUser).toHaveBeenCalledExactlyOnceWith(testPersonId, mockTransaction);
    expect(cleanErrorsAndThrow).toHaveBeenCalledExactlyOnceWith(
      [validationMessage],
      "setPersonStates",
      "SET_PERSON_STATES_VALIDATION_FAILED"
    );
    expect(selectManyStates).not.toHaveBeenCalled();
  });

  it("should throw if states to remove are assigned to demonstrations", async () => {
    const validationMessage = "test validation error";
    vi.mocked(checkPersonIsStateUser).mockResolvedValue(undefined);
    vi.mocked(selectManyStates).mockResolvedValue([{ id: "NY" }, { id: "CA" }] as never);
    vi.mocked(checkPersonNotAssignedToDemonstrationOfStates).mockResolvedValue(validationMessage);

    await expect(setPersonStates(testPersonId, ["NY"])).rejects.toThrow(validationError);

    expect(selectManyStates).toHaveBeenCalledExactlyOnceWith({
      personStates: {
        some: {
          personId: testPersonId,
        },
      },
    });
    expect(checkPersonNotAssignedToDemonstrationOfStates).toHaveBeenCalledExactlyOnceWith(
      testPersonId,
      ["CA"],
      mockTransaction
    );
    expect(cleanErrorsAndThrow).toHaveBeenCalledExactlyOnceWith(
      [validationMessage],
      "setPersonStates",
      "SET_PERSON_STATES_VALIDATION_FAILED"
    );
    expect(deleteManyPersonStates).not.toHaveBeenCalled();
    expect(insertManyPersonStates).not.toHaveBeenCalled();
  });

  it("should remove old states, add new states, and return the updated person", async () => {
    vi.mocked(checkPersonIsStateUser).mockResolvedValue(undefined);
    vi.mocked(selectManyStates).mockResolvedValue([{ id: "NY" }, { id: "CA" }] as never);
    vi.mocked(checkPersonNotAssignedToDemonstrationOfStates).mockResolvedValue(undefined);
    vi.mocked(selectPersonOrThrow).mockResolvedValue(testReturnedPerson as never);

    const result = await setPersonStates(testPersonId, ["CA", "TX"]);

    expect(checkPersonIsStateUser).toHaveBeenCalledExactlyOnceWith(testPersonId, mockTransaction);
    expect(checkPersonNotAssignedToDemonstrationOfStates).toHaveBeenCalledExactlyOnceWith(
      testPersonId,
      ["NY"],
      mockTransaction
    );
    expect(deleteManyPersonStates).toHaveBeenCalledExactlyOnceWith({
      personId: testPersonId,
      stateId: {
        in: ["NY"],
      },
    });
    expect(insertManyPersonStates).toHaveBeenCalledExactlyOnceWith([
      {
        personId: testPersonId,
        stateId: "TX",
      },
    ]);
    expect(selectPersonOrThrow).toHaveBeenCalledExactlyOnceWith({ id: testPersonId });
    expect(result).toBe(testReturnedPerson);
  });

  it("should not update person states if there are no changes", async () => {
    vi.mocked(checkPersonIsStateUser).mockResolvedValue(undefined);
    vi.mocked(selectManyStates).mockResolvedValue([{ id: "NY" }, { id: "CA" }] as never);
    vi.mocked(checkPersonNotAssignedToDemonstrationOfStates).mockResolvedValue(undefined);
    vi.mocked(selectPersonOrThrow).mockResolvedValue(testReturnedPerson as never);

    const result = await setPersonStates(testPersonId, ["NY", "CA"]);

    expect(checkPersonNotAssignedToDemonstrationOfStates).toHaveBeenCalledExactlyOnceWith(
      testPersonId,
      [],
      mockTransaction
    );
    expect(deleteManyPersonStates).not.toHaveBeenCalled();
    expect(insertManyPersonStates).not.toHaveBeenCalled();
    expect(selectPersonOrThrow).toHaveBeenCalledExactlyOnceWith({ id: testPersonId });
    expect(result).toBe(testReturnedPerson);
  });
});
