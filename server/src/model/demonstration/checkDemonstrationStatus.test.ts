import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { ApplicationStatus } from "../../types";
import { checkDemonstrationStatus } from "./checkDemonstrationStatus";

describe("checkDemonstrationStatus", () => {
  it("should return undefined if the demonstration is Approved", () => {
    const testInput: Partial<PrismaDemonstration> = {
      id: "abc123",
      statusId: "Approved" satisfies ApplicationStatus,
    };
    const result = checkDemonstrationStatus(testInput as PrismaDemonstration, "deliverable");
    expect(result).toBeUndefined();
  });

  it("should return an error string if the demonstration is not Approved", () => {
    const testInput: Partial<PrismaDemonstration> = {
      id: "abc123",
      statusId: "Under Review" satisfies ApplicationStatus,
    };
    const result = checkDemonstrationStatus(testInput as PrismaDemonstration, "deliverable");
    expect(result).toBe(
      "Demonstration abc123 is not in Approved status; cannot create deliverable."
    );
  });

  it("passes the subject name for use in the error message", () => {
    const testInput: Partial<PrismaDemonstration> = {
      id: "abc123",
      statusId: "Under Review" satisfies ApplicationStatus,
    };
    const result = checkDemonstrationStatus(testInput as PrismaDemonstration, "amendment");
    expect(result).toBe("Demonstration abc123 is not in Approved status; cannot create amendment.");
  });
});
