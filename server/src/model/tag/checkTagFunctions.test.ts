// Vitest and other helpers
import { describe, it, expect, vi, beforeEach } from "vitest";

// Types
import type { DemonstrationTypeUsageSummary } from "../../types";

// Functions under test
import { checkDemonstrationTypeTagCanBeDeleted } from "./checkTagFunctions";

// Mock imports
const testCustomGQLError = new Error("Test throwCustomGQLError!");
vi.mock("../../errors/errorCodes", () => ({
  throwCustomGQLError: vi.fn(() => {
    throw testCustomGQLError;
  }),
}));

import { throwCustomGQLError } from "../../errors/errorCodes";

describe("checkTagFunctions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const demonstrationTypeInUse: DemonstrationTypeUsageSummary = {
    demonstrationTypeName: "In Use Demonstration Type",
    approvalStatus: "Approved",
    countOfTaggedApplications: {
      demonstrations: 3,
      amendments: 0,
      renewals: 4,
    },
    countOfTaggedReferences: 3,
    countOfAssignedDemonstrations: 3,
    countOfAssignedDeliverables: 13,
  };

  const demonstrationTypeNotInUse: DemonstrationTypeUsageSummary = {
    demonstrationTypeName: "Not In Use Demonstration Type",
    approvalStatus: "Approved",
    countOfTaggedApplications: {
      demonstrations: 0,
      amendments: 0,
      renewals: 0,
    },
    countOfTaggedReferences: 0,
    countOfAssignedDemonstrations: 0,
    countOfAssignedDeliverables: 0,
  };

  it("should not throw if the input is not in use", () => {
    checkDemonstrationTypeTagCanBeDeleted(demonstrationTypeNotInUse);
    expect(throwCustomGQLError).not.toHaveBeenCalled();
  });

  it("should throw if the input is in use", () => {
    expect(() => checkDemonstrationTypeTagCanBeDeleted(demonstrationTypeInUse)).toThrow(
      testCustomGQLError
    );
    expect(throwCustomGQLError).toHaveBeenCalledExactlyOnceWith(
      "Cannot delete In Use Demonstration Type. " +
        "The demonstration type In Use Demonstration Type is used in the following places: " +
        "3 demonstration applications, " +
        "0 amendment applications, " +
        "4 renewal applications, " +
        "3 references, " +
        "3 demonstrations, and " +
        "13 deliverables.",
      "TAG_IN_USE_CANNOT_BE_DELETED_ERROR"
    );
  });
});
