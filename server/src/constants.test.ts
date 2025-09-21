import { describe, it, expect } from "vitest";
import {
  BUNDLE_STATUS,
  ROLES,
  PERSON_TYPES,
  GRANT_LEVELS,
  BUNDLE_TYPE,
  SIGNATURE_LEVEL,
  CMCS_DIVISION,
  DOCUMENT_TYPES,
  PHASE,
  PHASE_STATUS,
  DATE_TYPES,
  STATES_AND_TERRITORIES,
} from "./constants";

describe("constants", () => {
  describe("BUNDLE_STATUS", () => {
    it("should contain all expected bundle statuses", () => {
      const expectedStatuses = [
        "Pre-Submission",
        "Under Review",
        "Approved",
        "Denied",
        "Withdrawn",
        "On-hold",
      ];
      
      expect(BUNDLE_STATUS).toEqual(expectedStatuses);
      expect(BUNDLE_STATUS).toHaveLength(6);
    });

    
  });

  describe("ROLES", () => {
    it("should contain all expected roles", () => {
      const expectedRoles = [
        "Project Officer",
        "State Point of Contact",
        "DDME Analyst",
        "Policy Technical Director",
        "Monitoring & Evaluation Technical Director",
        "All Users",
      ];
      
      expect(ROLES).toEqual(expectedRoles);
      expect(ROLES).toHaveLength(6);
    });

    it("should include management roles", () => {
      expect(ROLES).toContain("Policy Technical Director");
      expect(ROLES).toContain("Monitoring & Evaluation Technical Director");
    });
  });

  describe("PERSON_TYPES", () => {
    it("should contain all expected person types", () => {
      const expectedTypes = [
        "demos-admin",
        "demos-cms-user",
        "demos-state-user",
        "non-user-contact",
      ];
      
      expect(PERSON_TYPES).toEqual(expectedTypes);
      expect(PERSON_TYPES).toHaveLength(4);
    });

    it("should include admin and user types", () => {
      expect(PERSON_TYPES).toContain("demos-admin");
      expect(PERSON_TYPES).toContain("demos-cms-user");
      expect(PERSON_TYPES).toContain("demos-state-user");
    });
  });

  describe("GRANT_LEVELS", () => {
    it("should contain system and demonstration levels", () => {
      expect(GRANT_LEVELS).toEqual(["System", "Demonstration"]);
      expect(GRANT_LEVELS).toHaveLength(2);
    });
  });

  describe("BUNDLE_TYPE", () => {
    it("should contain all bundle types as object", () => {
      expect(BUNDLE_TYPE.DEMONSTRATION).toBe("DEMONSTRATION");
      expect(BUNDLE_TYPE.AMENDMENT).toBe("AMENDMENT");
      expect(BUNDLE_TYPE.EXTENSION).toBe("EXTENSION");
    });

    it("should have exactly 3 bundle types", () => {
      expect(Object.keys(BUNDLE_TYPE)).toHaveLength(3);
    });
  });

  describe("SIGNATURE_LEVEL", () => {
    it("should contain all signature levels", () => {
      expect(SIGNATURE_LEVEL).toEqual(["OA", "OCD", "OGD"]);
      expect(SIGNATURE_LEVEL).toHaveLength(3);
    });
  });

  describe("CMCS_DIVISION", () => {
    it("should contain both CMCS divisions", () => {
      const expectedDivisions = [
        "Division of System Reform Demonstrations",
        "Division of Eligibility and Coverage Demonstrations",
      ];
      
      expect(CMCS_DIVISION).toEqual(expectedDivisions);
      expect(CMCS_DIVISION).toHaveLength(2);
    });
  });

  describe("DOCUMENT_TYPES", () => {
    it("should contain all expected document types", () => {
      expect(DOCUMENT_TYPES).toHaveLength(12);
      expect(DOCUMENT_TYPES).toContain("Application Completeness Letter");
      expect(DOCUMENT_TYPES).toContain("Approval Letter");
      expect(DOCUMENT_TYPES).toContain("State Application");
      expect(DOCUMENT_TYPES).toContain("General File");
    });

    it("should include budget neutrality documents", () => {
      expect(DOCUMENT_TYPES).toContain("Final BN Worksheet");
      expect(DOCUMENT_TYPES).toContain("Final Budget Neutrality Formulation Workbook");
    });

    it("should include review and approval documents", () => {
      expect(DOCUMENT_TYPES).toContain("Internal Completeness Review Form");
      expect(DOCUMENT_TYPES).toContain("Signed Decision Memo");
      expect(DOCUMENT_TYPES).toContain("Formal OMB Policy Concurrence Email");
    });
  });

  describe("PHASE", () => {
    it("should contain all workflow phases", () => {
      const expectedPhases = ["None", "Concept", "State Application", "Completeness"];
      expect(PHASE).toEqual(expectedPhases);
      expect(PHASE).toHaveLength(4);
    });
  });

  describe("PHASE_STATUS", () => {
    it("should contain all phase statuses", () => {
      const expectedStatuses = ["Not Started", "Started", "Completed", "Skipped"];
      expect(PHASE_STATUS).toEqual(expectedStatuses);
      expect(PHASE_STATUS).toHaveLength(4);
    });
  });

  describe("DATE_TYPES", () => {
    it("should contain all date types", () => {
      expect(DATE_TYPES).toHaveLength(9);
      expect(DATE_TYPES).toContain("Start Date");
      expect(DATE_TYPES).toContain("Completion Date");
    });

    it("should include submission dates", () => {
      expect(DATE_TYPES).toContain("Pre-Submission Submitted Date");
      expect(DATE_TYPES).toContain("State Application Submitted Date");
    });

    it("should include review dates", () => {
      expect(DATE_TYPES).toContain("Completeness Review Due Date");
      expect(DATE_TYPES).toContain("State Application Deemed Complete");
    });

    it("should include comment period dates", () => {
      expect(DATE_TYPES).toContain("Federal Comment Period Start Date");
      expect(DATE_TYPES).toContain("Federal Comment Period End Date");
    });
  });

  describe("STATES_AND_TERRITORIES", () => {
    it("should contain all 50 US states", () => {
      const states = STATES_AND_TERRITORIES.filter(item => 
        item.id.length === 2 && !["AS", "DC", "FM", "GU", "MH", "MP", "PW", "PR", "VI"].includes(item.id)
      );
      expect(states).toHaveLength(50);
    });

    it("should contain territories and DC", () => {
      const territories = ["AS", "DC", "FM", "GU", "MH", "MP", "PW", "PR", "VI"];
      territories.forEach(territoryId => {
        const territory = STATES_AND_TERRITORIES.find(item => item.id === territoryId);
        expect(territory).toBeDefined();
      });
    });

    it("should have correct structure for each entry", () => {
      STATES_AND_TERRITORIES.forEach(item => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(typeof item.id).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(item.id.length).toBe(2);
        expect(item.name.length).toBeGreaterThan(0);
      });
    });

    it("should contain specific well-known states", () => {
      const california = STATES_AND_TERRITORIES.find(item => item.id === "CA");
      expect(california).toEqual({ id: "CA", name: "California" });

      const texas = STATES_AND_TERRITORIES.find(item => item.id === "TX");
      expect(texas).toEqual({ id: "TX", name: "Texas" });

      const dc = STATES_AND_TERRITORIES.find(item => item.id === "DC");
      expect(dc).toEqual({ id: "DC", name: "District of Columbia" });
    });

    it("should have exactly 59 total entries", () => {
      // 50 states + 9 territories/districts
      expect(STATES_AND_TERRITORIES).toHaveLength(59);
    });

    it("should have unique IDs", () => {
      const ids = STATES_AND_TERRITORIES.map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique names", () => {
      const names = STATES_AND_TERRITORIES.map(item => item.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should be in the expected order", () => {
      // First few should be in alphabetical order by state name
      expect(STATES_AND_TERRITORIES[0]).toEqual({ id: "AL", name: "Alabama" });
      expect(STATES_AND_TERRITORIES[1]).toEqual({ id: "AK", name: "Alaska" });
      expect(STATES_AND_TERRITORIES[2]).toEqual({ id: "AZ", name: "Arizona" });
    });
  });
});