import { describe, it, expect, vi } from "vitest";
import { deleteAllApplicationTags } from "./deleteAllApplicationTags";
import { SetApplicationTagsInput } from "../../../types";

describe("deleteAllApplicationTags", () => {
  const transactionMocks = {
    applicationTagAssignment: {
      deleteMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagAssignment: {
      deleteMany: transactionMocks.applicationTagAssignment.deleteMany,
    },
  } as any;
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  it("should delete requested application tags", async () => {
    const expectedCall = {
      where: {
        applicationId: testApplicationId,
      },
    };

    await deleteAllApplicationTags(testApplicationId, mockTransaction);
    expect(transactionMocks.applicationTagAssignment.deleteMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
