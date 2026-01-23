import { describe, it, expect, vi } from "vitest";
import { insertApplicationTags } from "./insertApplicationTags";
import { SetApplicationTagsInput } from "../../../types";

describe("insertApplicationTags", () => {
  const transactionMocks = {
    applicationTagAssignment: {
      createMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationTagAssignment: {
      createMany: transactionMocks.applicationTagAssignment.createMany,
    },
  } as any;
  const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
  const testTags = ["Test Tag 1", "Another Test Tag", "This One For Health"];

  it("should create the requested application tags", async () => {
    const expectedCall = {
      data: [
        {
          applicationId: testApplicationId,
          tagId: "Test Tag 1",
          tagTypeId: "Application",
        },
        {
          applicationId: testApplicationId,
          tagId: "Another Test Tag",
          tagTypeId: "Application",
        },
        {
          applicationId: testApplicationId,
          tagId: "This One For Health",
          tagTypeId: "Application",
        },
      ],
    };

    await insertApplicationTags(testApplicationId, testTags, mockTransaction);
    expect(transactionMocks.applicationTagAssignment.createMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});
