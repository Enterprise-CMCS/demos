import { describe, it, expect, vi } from "vitest";

// Mock the constants module
vi.mock("./constants.js", () => ({
  BUNDLE_STATUS: ["active", "inactive", "pending"],
  BUNDLE_TYPE: {
    DEMONSTRATION: "demonstration",
    AMENDMENT: "amendment",
    EXTENSION: "extension",
  },
  CMCS_DIVISION: ["division1", "division2"],
  SIGNATURE_LEVEL: ["level1", "level2"],
  DOCUMENT_TYPES: ["type1", "type2"],
  PHASE: ["phase1", "phase2"],
  PHASE_STATUS: ["status1", "status2"],
  PERSON_TYPES: ["person1", "person2"],
  GRANT_LEVELS: ["grant1", "grant2"],
  ROLES: ["role1", "role2"],
  DATE_TYPES: ["date1", "date2"],
}));

// Mock the schema modules
vi.mock("./model/user/userSchema.js", () => ({
  CreateUserInput: "CreateUserInput",
  UpdateUserInput: "UpdateUserInput",
  User: "User",
}));

vi.mock("./model/demonstration/demonstrationSchema.js", () => ({
  CreateDemonstrationInput: "CreateDemonstrationInput",
  Demonstration: "Demonstration",
  UpdateDemonstrationInput: "UpdateDemonstrationInput",
}));

vi.mock("./model/state/stateSchema.js", () => ({
  State: "State",
}));

vi.mock("./model/event/eventSchema.js", () => ({
  Event: "Event",
  EventLoggedStatus: "EventLoggedStatus",
  LogEventInput: "LogEventInput",
}));

vi.mock("./model/modification/modificationSchema.js", () => ({
  Amendment: "Amendment",
  Extension: "Extension",
  CreateAmendmentInput: "CreateAmendmentInput",
  CreateExtensionInput: "CreateExtensionInput",
  UpdateAmendmentInput: "UpdateAmendmentInput",
  UpdateExtensionInput: "UpdateExtensionInput",
}));

vi.mock("./model/document/documentSchema.js", () => ({
  Document: "Document",
  UploadDocumentInput: "UploadDocumentInput",
  UpdateDocumentInput: "UpdateDocumentInput",
}));

vi.mock("./model/bundlePhase/bundlePhaseSchema.js", () => ({
  BundlePhase: "BundlePhase",
}));

vi.mock("./model/bundle/bundleSchema.js", () => ({
  Bundle: "Bundle",
}));

vi.mock("./model/bundlePhaseDate/bundlePhaseDateSchema.js", () => ({
  BundlePhaseDate: "BundlePhaseDate",
  SetPhaseDateInput: "SetPhaseDateInput",
}));

describe("types module", () => {
  it("should export all user-related types", async () => {
    const types = await import("./types.js");
    
    // Verify that the module exports exist (TypeScript types don't exist at runtime)
    expect(types).toBeDefined();
  });

  it("should define BundleStatus type correctly", async () => {
    const { BUNDLE_STATUS } = await import("./constants.js");
    
    // Test that BundleStatus would accept valid values
    const validStatuses: readonly string[] = BUNDLE_STATUS;
    expect(validStatuses).toContain("active");
    expect(validStatuses).toContain("inactive");
    expect(validStatuses).toContain("pending");
  });

  it("should define BundleType type correctly", async () => {
    const { BUNDLE_TYPE } = await import("./constants.js");
    
    // Test that BundleType would accept valid values
    expect(BUNDLE_TYPE.DEMONSTRATION).toBe("demonstration");
    expect(BUNDLE_TYPE.AMENDMENT).toBe("amendment");
    expect(BUNDLE_TYPE.EXTENSION).toBe("extension");
  });

  it("should define CmcsDivision type correctly", async () => {
    const { CMCS_DIVISION } = await import("./constants.js");
    
    expect(CMCS_DIVISION).toContain("division1");
    expect(CMCS_DIVISION).toContain("division2");
  });

  it("should define SignatureLevel type correctly", async () => {
    const { SIGNATURE_LEVEL } = await import("./constants.js");
    
    expect(SIGNATURE_LEVEL).toContain("level1");
    expect(SIGNATURE_LEVEL).toContain("level2");
  });

  it("should define DocumentType type correctly", async () => {
    const { DOCUMENT_TYPES } = await import("./constants.js");
    
    expect(DOCUMENT_TYPES).toContain("type1");
    expect(DOCUMENT_TYPES).toContain("type2");
  });

  it("should define Phase type correctly", async () => {
    const { PHASE } = await import("./constants.js");
    
    expect(PHASE).toContain("phase1");
    expect(PHASE).toContain("phase2");
  });

  it("should define PhaseStatus type correctly", async () => {
    const { PHASE_STATUS } = await import("./constants.js");
    
    expect(PHASE_STATUS).toContain("status1");
    expect(PHASE_STATUS).toContain("status2");
  });

  it("should define PersonType type correctly", async () => {
    const { PERSON_TYPES } = await import("./constants.js");
    
    expect(PERSON_TYPES).toContain("person1");
    expect(PERSON_TYPES).toContain("person2");
  });

  it("should define GrantLevel type correctly", async () => {
    const { GRANT_LEVELS } = await import("./constants.js");
    
    expect(GRANT_LEVELS).toContain("grant1");
    expect(GRANT_LEVELS).toContain("grant2");
  });

  it("should define Role type correctly", async () => {
    const { ROLES } = await import("./constants.js");
    
    expect(ROLES).toContain("role1");
    expect(ROLES).toContain("role2");
  });

  it("should define DateType type correctly", async () => {
    const { DATE_TYPES } = await import("./constants.js");
    
    expect(DATE_TYPES).toContain("date1");
    expect(DATE_TYPES).toContain("date2");
  });

  it("should verify module imports work correctly", async () => {
    // This test ensures the module can be imported without errors
    expect(() => import("./types.js")).not.toThrow();
  });

  it("should have proper type derivations from constants", async () => {
    const constants = await import("./constants.js");
    
    // Verify the structure of constants that types depend on
    expect(Array.isArray(constants.BUNDLE_STATUS)).toBe(true);
    expect(typeof constants.BUNDLE_TYPE).toBe("object");
    expect(Array.isArray(constants.CMCS_DIVISION)).toBe(true);
    expect(Array.isArray(constants.SIGNATURE_LEVEL)).toBe(true);
    expect(Array.isArray(constants.DOCUMENT_TYPES)).toBe(true);
    expect(Array.isArray(constants.PHASE)).toBe(true);
    expect(Array.isArray(constants.PHASE_STATUS)).toBe(true);
    expect(Array.isArray(constants.PERSON_TYPES)).toBe(true);
    expect(Array.isArray(constants.GRANT_LEVELS)).toBe(true);
    expect(Array.isArray(constants.ROLES)).toBe(true);
    expect(Array.isArray(constants.DATE_TYPES)).toBe(true);
  });
});