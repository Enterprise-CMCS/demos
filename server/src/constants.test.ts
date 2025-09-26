import { describe, it, expect } from "vitest";
import * as constants from "./constants";

describe("constants", () => {
  it("should export ROLES with expected values", () => {
    expect(Array.isArray(constants.ROLES)).toBe(true);
    expect(constants.ROLES).toContain("Project Officer");
    expect(constants.ROLES).toContain("State Point of Contact");
    expect(constants.ROLES).toHaveLength(5);
  });

  it("should export PERSON_TYPES with expected values", () => {
    expect(Array.isArray(constants.PERSON_TYPES)).toBe(true);
    expect(constants.PERSON_TYPES).toContain("demos-admin");
    expect(constants.PERSON_TYPES).toHaveLength(4);
  });

  it("should export BUNDLE_TYPE object with keys", () => {
    expect(typeof constants.BUNDLE_TYPE).toBe("object");
    expect(constants.BUNDLE_TYPE.DEMONSTRATION).toBe("DEMONSTRATION");
    expect(constants.BUNDLE_TYPE.AMENDMENT).toBe("AMENDMENT");
    expect(constants.BUNDLE_TYPE.EXTENSION).toBe("EXTENSION");
  });

  it("should export SIGNATURE_LEVEL array", () => {
    expect(Array.isArray(constants.SIGNATURE_LEVEL)).toBe(true);
    expect(constants.SIGNATURE_LEVEL).toEqual(["OA", "OCD", "OGD"]);
  });

  it("should export CMCS_DIVISION array with two divisions", () => {
    expect(Array.isArray(constants.CMCS_DIVISION)).toBe(true);
    expect(constants.CMCS_DIVISION).toHaveLength(2);
  });

  it("should export DOCUMENT_TYPES array and contain expected types", () => {
    expect(Array.isArray(constants.DOCUMENT_TYPES)).toBe(true);
    expect(constants.DOCUMENT_TYPES).toContain("Approval Letter");
  });

  it("should export PHASE and PHASE_STATUS", () => {
    expect(Array.isArray(constants.PHASE)).toBe(true);
    expect(constants.PHASE_STATUS).toContain("Not Started");
  });

  it("should export DATE_TYPES and STATES_AND_TERRITORIES", () => {
    expect(Array.isArray(constants.DATE_TYPES)).toBe(true);
    expect(Array.isArray(constants.STATES_AND_TERRITORIES)).toBe(true);
    // spot check a few states
    expect(constants.STATES_AND_TERRITORIES.find((s) => s.id === "CA")?.name).toBe("California");
    expect(constants.STATES_AND_TERRITORIES.find((s) => s.id === "NY")?.name).toBe("New York");
  });
});
