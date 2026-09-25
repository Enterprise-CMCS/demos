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
      "Cannot delete In Use Demonstration Type; in use in 23 locations.",
      "TAG_CANNOT_BE_DELETED_ERROR"
    );
  });
});
