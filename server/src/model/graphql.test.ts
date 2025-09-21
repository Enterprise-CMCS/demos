import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentNode } from "graphql";

// Mock all the schema imports
vi.mock("./bundle/bundleSchema.js", () => ({
  bundleSchema: { kind: "Document", definitions: [{ name: { value: "Bundle" } }] },
}));

vi.mock("./bundleStatus/bundleStatusSchema.js", () => ({
  bundleStatusSchema: { kind: "Document", definitions: [{ name: { value: "BundleStatus" } }] },
}));

vi.mock("./bundlePhase/bundlePhaseSchema.js", () => ({
  bundlePhaseSchema: { kind: "Document", definitions: [{ name: { value: "BundlePhase" } }] },
}));

vi.mock("./bundlePhase/bundlePhaseResolvers.js", () => ({
  bundlePhaseResolvers: {
    Query: { bundlePhases: vi.fn() },
    BundlePhase: { bundle: vi.fn() },
  },
}));

vi.mock("./bundlePhaseDate/bundlePhaseDateSchema.js", () => ({
  bundlePhaseDateSchema: { kind: "Document", definitions: [{ name: { value: "BundlePhaseDate" } }] },
}));

vi.mock("./bundlePhaseDate/bundlePhaseDateResolvers.js", () => ({
  bundlePhaseDateResolvers: {
    Query: { bundlePhaseDates: vi.fn() },
    BundlePhaseDate: { date: vi.fn() },
  },
}));

vi.mock("./dateType/dateTypeSchema.js", () => ({
  dateTypeSchema: { kind: "Document", definitions: [{ name: { value: "DateType" } }] },
}));

vi.mock("./demonstration/demonstrationSchema.js", () => ({
  demonstrationSchema: { kind: "Document", definitions: [{ name: { value: "Demonstration" } }] },
}));

vi.mock("./demonstration/demonstrationResolvers.js", () => ({
  demonstrationResolvers: {
    Query: { demonstration: vi.fn(), demonstrations: vi.fn() },
    Mutation: { createDemonstration: vi.fn(), updateDemonstration: vi.fn() },
    Demonstration: { state: vi.fn(), projectOfficer: vi.fn() },
  },
}));

vi.mock("./document/documentSchema.js", () => ({
  documentSchema: { kind: "Document", definitions: [{ name: { value: "Document" } }] },
}));

vi.mock("./document/documentResolvers.js", () => ({
  documentResolvers: {
    Query: { document: vi.fn(), documents: vi.fn() },
    Mutation: { uploadDocument: vi.fn(), downloadDocument: vi.fn() },
    Document: { owner: vi.fn(), bundle: vi.fn() },
  },
}));

vi.mock("./documentType/documentTypeSchema.js", () => ({
  documentTypeSchema: { kind: "Document", definitions: [{ name: { value: "DocumentType" } }] },
}));

vi.mock("./event/index.js", () => ({
  eventSchema: { kind: "Document", definitions: [{ name: { value: "Event" } }] },
  eventResolvers: {
    Query: { events: vi.fn() },
    Mutation: { logEvent: vi.fn() },
    Event: { user: vi.fn(), withRole: vi.fn() },
  },
}));

vi.mock("./modification/modificationSchema.js", () => ({
  modificationSchema: { kind: "Document", definitions: [{ name: { value: "Modification" } }] },
}));

vi.mock("./modification/modificationResolvers.js", () => ({
  modificationResolvers: {
    Query: { amendment: vi.fn(), amendments: vi.fn(), extension: vi.fn(), extensions: vi.fn() },
    Mutation: { createAmendment: vi.fn(), createExtension: vi.fn() },
    Amendment: { demonstration: vi.fn(), projectOfficer: vi.fn() },
    Extension: { demonstration: vi.fn(), projectOfficer: vi.fn() },
  },
}));

vi.mock("./phase/phaseSchema.js", () => ({
  phaseSchema: { kind: "Document", definitions: [{ name: { value: "Phase" } }] },
}));

vi.mock("./phaseStatus/phaseStatusSchema.js", () => ({
  phaseStatusSchema: { kind: "Document", definitions: [{ name: { value: "PhaseStatus" } }] },
}));

vi.mock("./state/stateSchema.js", () => ({
  stateSchema: { kind: "Document", definitions: [{ name: { value: "State" } }] },
}));

vi.mock("./state/stateResolvers.js", () => ({
  stateResolvers: {
    Query: { states: vi.fn() },
    State: { demonstrations: vi.fn() },
  },
}));

vi.mock("./user/userSchema.js", () => ({
  userSchema: { kind: "Document", definitions: [{ name: { value: "User" } }] },
}));

vi.mock("./user/userResolvers.js", () => ({
  userResolvers: {
    Query: { user: vi.fn(), users: vi.fn(), currentUser: vi.fn() },
    Mutation: { createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() },
    User: { events: vi.fn(), ownedDocuments: vi.fn(), roles: vi.fn() },
  },
}));

vi.mock("./personType/personTypeSchema.js", () => ({
  personTypeSchema: { kind: "Document", definitions: [{ name: { value: "PersonType" } }] },
}));

vi.mock("./role/roleSchema.js", () => ({
  roleSchema: { kind: "Document", definitions: [{ name: { value: "Role" } }] },
}));

vi.mock("graphql-scalars", () => ({
  JSONObjectDefinition: { kind: "Document", definitions: [{ name: { value: "JSONObject" } }] },
  DateTimeTypeDefinition: { kind: "Document", definitions: [{ name: { value: "DateTime" } }] },
  DateTypeDefinition: { kind: "Document", definitions: [{ name: { value: "Date" } }] },
}));

vi.mock("graphql-tag", () => ({
  gql: vi.fn((template: TemplateStringsArray) => ({
    kind: "Document",
    definitions: [{ name: { value: "MockExtension" } }],
    loc: { source: { body: template[0] } },
  })),
}));

import { typeDefs, resolvers } from "./graphql.js";
import { gql } from "graphql-tag";

// Import mocked modules to access their values
import { bundleSchema } from "./bundle/bundleSchema.js";
import { bundleStatusSchema } from "./bundleStatus/bundleStatusSchema.js";
import { bundlePhaseSchema } from "./bundlePhase/bundlePhaseSchema.js";
import { bundlePhaseResolvers } from "./bundlePhase/bundlePhaseResolvers.js";
import { bundlePhaseDateSchema } from "./bundlePhaseDate/bundlePhaseDateSchema.js";
import { bundlePhaseDateResolvers } from "./bundlePhaseDate/bundlePhaseDateResolvers.js";
import { dateTypeSchema } from "./dateType/dateTypeSchema.js";
import { demonstrationSchema } from "./demonstration/demonstrationSchema.js";
import { demonstrationResolvers } from "./demonstration/demonstrationResolvers.js";
import { documentSchema } from "./document/documentSchema.js";
import { documentResolvers } from "./document/documentResolvers.js";
import { documentTypeSchema } from "./documentType/documentTypeSchema.js";
import { eventSchema, eventResolvers } from "./event/index.js";
import { modificationSchema } from "./modification/modificationSchema.js";
import { modificationResolvers } from "./modification/modificationResolvers.js";
import { phaseSchema } from "./phase/phaseSchema.js";
import { phaseStatusSchema } from "./phaseStatus/phaseStatusSchema.js";
import { stateSchema } from "./state/stateSchema.js";
import { stateResolvers } from "./state/stateResolvers.js";
import { userSchema } from "./user/userSchema.js";
import { userResolvers } from "./user/userResolvers.js";
import { personTypeSchema } from "./personType/personTypeSchema.js";
import { roleSchema } from "./role/roleSchema.js";
import { JSONObjectDefinition, DateTimeTypeDefinition, DateTypeDefinition } from "graphql-scalars";

describe("graphql", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("typeDefs", () => {
    it("should include all required schemas", () => {
      expect(typeDefs).toBeDefined();
      expect(Array.isArray(typeDefs)).toBe(true);
      expect(typeDefs.length).toBeGreaterThan(0);
    });

    it("should include bundle schema", () => {
      expect(typeDefs).toContain(bundleSchema);
    });

    it("should include bundleStatus schema", () => {
      expect(typeDefs).toContain(bundleStatusSchema);
    });

    it("should include bundlePhase schema", () => {
      expect(typeDefs).toContain(bundlePhaseSchema);
    });

    it("should include bundlePhaseDate schema", () => {
      expect(typeDefs).toContain(bundlePhaseDateSchema);
    });

    it("should include dateType schema", () => {
      expect(typeDefs).toContain(dateTypeSchema);
    });

    it("should include demonstration schema", () => {
      expect(typeDefs).toContain(demonstrationSchema);
    });

    it("should include document schema", () => {
      expect(typeDefs).toContain(documentSchema);
    });

    it("should include documentType schema", () => {
      expect(typeDefs).toContain(documentTypeSchema);
    });

    it("should include event schema", () => {
      expect(typeDefs).toContain(eventSchema);
    });

    it("should include modification schema", () => {
      expect(typeDefs).toContain(modificationSchema);
    });

    it("should include phase schema", () => {
      expect(typeDefs).toContain(phaseSchema);
    });

    it("should include phaseStatus schema", () => {
      expect(typeDefs).toContain(phaseStatusSchema);
    });

    it("should include state schema", () => {
      expect(typeDefs).toContain(stateSchema);
    });

    it("should include user schema", () => {
      expect(typeDefs).toContain(userSchema);
    });

    it("should include personType schema", () => {
      expect(typeDefs).toContain(personTypeSchema);
    });

    it("should include role schema", () => {
      expect(typeDefs).toContain(roleSchema);
    });

    it("should include scalar type definitions", () => {
      expect(typeDefs).toContain(JSONObjectDefinition);
      expect(typeDefs).toContain(DateTimeTypeDefinition);
      expect(typeDefs).toContain(DateTypeDefinition);
    });

    it("should have all schemas as valid GraphQL documents", () => {
      typeDefs.forEach((schema, index) => {
        expect(schema).toBeDefined();
        expect(typeof schema).toBe("object");
        expect(schema.kind).toBe("Document");
        expect(schema.definitions).toBeDefined();
        expect(Array.isArray(schema.definitions)).toBe(true);
      });
    });

    it("should have the correct number of type definitions", () => {
      // 14 main schemas + 3 scalar types + 1 mock extension + 1 personType + 1 role = 20
      expect(typeDefs).toHaveLength(20);
    });
  });

  describe("resolvers", () => {
    it("should include all required resolvers", () => {
      expect(resolvers).toBeDefined();
      expect(Array.isArray(resolvers)).toBe(true);
      expect(resolvers.length).toBeGreaterThan(0);
    });

    it("should include bundlePhase resolvers", () => {
      expect(resolvers).toContain(bundlePhaseResolvers);
    });

    it("should include bundlePhaseDate resolvers", () => {
      expect(resolvers).toContain(bundlePhaseDateResolvers);
    });

    it("should include demonstration resolvers", () => {
      expect(resolvers).toContain(demonstrationResolvers);
    });

    it("should include document resolvers", () => {
      expect(resolvers).toContain(documentResolvers);
    });

    it("should include event resolvers", () => {
      expect(resolvers).toContain(eventResolvers);
    });

    it("should include modification resolvers", () => {
      expect(resolvers).toContain(modificationResolvers);
    });

    it("should include state resolvers", () => {
      expect(resolvers).toContain(stateResolvers);
    });

    it("should include user resolvers", () => {
      expect(resolvers).toContain(userResolvers);
    });

    it("should include mock demonstration resolver extension", () => {
      const mockResolverExtension = resolvers.find(
        (resolver) => resolver.Demonstration && resolver.Demonstration.contacts
      );
      expect(mockResolverExtension).toBeDefined();
      expect(mockResolverExtension.Demonstration.contacts).toBeInstanceOf(Function);
    });

    it("should have the correct number of resolver objects", () => {
      // 8 main resolvers + 1 mock extension = 9
      expect(resolvers).toHaveLength(9);
    });
  });
  
  describe("mock demonstration resolver extension", () => {
    it("should return mock contact data", async () => {
      const mockResolverExtension = resolvers.find(
        (resolver) => resolver.Demonstration && resolver.Demonstration.contacts
      );

      expect(mockResolverExtension).toBeDefined();

      const result = await mockResolverExtension.Demonstration.contacts();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      
      const contact = result[0];
      expect(contact).toEqual({
        id: "1",
        fullName: "John Doe",
        email: "john.doe@email.com",
        contactType: "Project Officer",
      });
    });

    it("should have proper contact structure", async () => {
      const mockResolverExtension = resolvers.find(
        (resolver) => resolver.Demonstration && resolver.Demonstration.contacts
      );

      const result = await mockResolverExtension.Demonstration.contacts();
      const contact = result[0];

      expect(contact.id).toBe("1");
      expect(contact.fullName).toBe("John Doe");
      expect(contact.email).toBe("john.doe@email.com");
      expect(contact.contactType).toBe("Project Officer");

      // Verify all required fields are present
      expect(typeof contact.id).toBe("string");
      expect(typeof contact.fullName).toBe("string");
      expect(typeof contact.email).toBe("string");
      expect(typeof contact.contactType).toBe("string");
    });

    it("should be a function that can be called multiple times", async () => {
      const mockResolverExtension = resolvers.find(
        (resolver) => resolver.Demonstration && resolver.Demonstration.contacts
      );

      const result1 = await mockResolverExtension.Demonstration.contacts();
      const result2 = await mockResolverExtension.Demonstration.contacts();

      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2); // Different instances
    });
  });

  describe("scalar types integration", () => {
    it("should include JSONObject scalar", () => {
      expect(typeDefs).toContain(JSONObjectDefinition);
      expect(JSONObjectDefinition.kind).toBe("Document");
    });

    it("should include DateTime scalar", () => {
      expect(typeDefs).toContain(DateTimeTypeDefinition);
      expect(DateTimeTypeDefinition.kind).toBe("Document");
    });

    it("should include Date scalar", () => {
      expect(typeDefs).toContain(DateTypeDefinition);
      expect(DateTypeDefinition.kind).toBe("Document");
    });

    it("should have scalar types in correct order", () => {
      const scalarIndex1 = typeDefs.indexOf(JSONObjectDefinition);
      const scalarIndex2 = typeDefs.indexOf(DateTimeTypeDefinition);
      const scalarIndex3 = typeDefs.indexOf(DateTypeDefinition);

      expect(scalarIndex1).toBeGreaterThan(-1);
      expect(scalarIndex2).toBeGreaterThan(-1);
      expect(scalarIndex3).toBeGreaterThan(-1);

      // They should be at the end of the array
      expect(scalarIndex1).toBeGreaterThan(typeDefs.length - 5);
      expect(scalarIndex2).toBeGreaterThan(typeDefs.length - 5);
      expect(scalarIndex3).toBeGreaterThan(typeDefs.length - 5);
    });
  });

  describe("resolver structure validation", () => {
    it("should have bundlePhase resolvers with correct structure", () => {
      expect(bundlePhaseResolvers.Query).toBeDefined();
      expect(bundlePhaseResolvers.BundlePhase).toBeDefined();
      expect(typeof bundlePhaseResolvers.Query.bundlePhases).toBe("function");
      expect(typeof bundlePhaseResolvers.BundlePhase.bundle).toBe("function");
    });

    it("should have demonstration resolvers with correct structure", () => {
      expect(demonstrationResolvers.Query).toBeDefined();
      expect(demonstrationResolvers.Mutation).toBeDefined();
      expect(demonstrationResolvers.Demonstration).toBeDefined();
      expect(typeof demonstrationResolvers.Query.demonstration).toBe("function");
      expect(typeof demonstrationResolvers.Mutation.createDemonstration).toBe("function");
      expect(typeof demonstrationResolvers.Demonstration.state).toBe("function");
    });

    it("should have document resolvers with correct structure", () => {
      expect(documentResolvers.Query).toBeDefined();
      expect(documentResolvers.Mutation).toBeDefined();
      expect(documentResolvers.Document).toBeDefined();
      expect(typeof documentResolvers.Query.document).toBe("function");
      expect(typeof documentResolvers.Mutation.uploadDocument).toBe("function");
      expect(typeof documentResolvers.Document.owner).toBe("function");
    });

    it("should have event resolvers with correct structure", () => {
      expect(eventResolvers.Query).toBeDefined();
      expect(eventResolvers.Mutation).toBeDefined();
      expect(eventResolvers.Event).toBeDefined();
      expect(typeof eventResolvers.Query.events).toBe("function");
      expect(typeof eventResolvers.Mutation.logEvent).toBe("function");
      expect(typeof eventResolvers.Event.user).toBe("function");
    });

    it("should have modification resolvers with correct structure", () => {
      expect(modificationResolvers.Query).toBeDefined();
      expect(modificationResolvers.Mutation).toBeDefined();
      expect(modificationResolvers.Amendment).toBeDefined();
      expect(modificationResolvers.Extension).toBeDefined();
      expect(typeof modificationResolvers.Query.amendment).toBe("function");
      expect(typeof modificationResolvers.Mutation.createAmendment).toBe("function");
      expect(typeof modificationResolvers.Amendment.demonstration).toBe("function");
    });

    it("should have user resolvers with correct structure", () => {
      expect(userResolvers.Query).toBeDefined();
      expect(userResolvers.Mutation).toBeDefined();
      expect(userResolvers.User).toBeDefined();
      expect(typeof userResolvers.Query.user).toBe("function");
      expect(typeof userResolvers.Mutation.createUser).toBe("function");
      expect(typeof userResolvers.User.events).toBe("function");
    });

    it("should have state resolvers with correct structure", () => {
      expect(stateResolvers.Query).toBeDefined();
      expect(stateResolvers.State).toBeDefined();
      expect(typeof stateResolvers.Query.states).toBe("function");
      expect(typeof stateResolvers.State.demonstrations).toBe("function");
    });
  });

  describe("imports and dependencies", () => {
    it("should import gql from graphql-tag", () => {
      expect(gql).toBeDefined();
      expect(typeof gql).toBe("function");
    });

    it("should import scalar definitions from graphql-scalars", () => {
      expect(JSONObjectDefinition).toBeDefined();
      expect(DateTimeTypeDefinition).toBeDefined();
      expect(DateTypeDefinition).toBeDefined();
    });

    it("should have all schema imports available", () => {
      expect(bundleSchema).toBeDefined();
      expect(bundleStatusSchema).toBeDefined();
      expect(bundlePhaseSchema).toBeDefined();
      expect(bundlePhaseDateSchema).toBeDefined();
      expect(dateTypeSchema).toBeDefined();
      expect(demonstrationSchema).toBeDefined();
      expect(documentSchema).toBeDefined();
      expect(documentTypeSchema).toBeDefined();
      expect(eventSchema).toBeDefined();
      expect(modificationSchema).toBeDefined();
      expect(phaseSchema).toBeDefined();
      expect(phaseStatusSchema).toBeDefined();
      expect(stateSchema).toBeDefined();
      expect(userSchema).toBeDefined();
      expect(personTypeSchema).toBeDefined();
      expect(roleSchema).toBeDefined();
    });

    it("should have all resolver imports available", () => {
      expect(bundlePhaseResolvers).toBeDefined();
      expect(bundlePhaseDateResolvers).toBeDefined();
      expect(demonstrationResolvers).toBeDefined();
      expect(documentResolvers).toBeDefined();
      expect(eventResolvers).toBeDefined();
      expect(modificationResolvers).toBeDefined();
      expect(stateResolvers).toBeDefined();
      expect(userResolvers).toBeDefined();
    });
  });

  describe("integration and consistency", () => {
    it("should have matching schema and resolver pairs", () => {
      // Check that we have resolvers for schemas that need them
      const hasSchemaAndResolver = [
        { schema: bundlePhaseSchema, resolver: bundlePhaseResolvers },
        { schema: bundlePhaseDateSchema, resolver: bundlePhaseDateResolvers },
        { schema: demonstrationSchema, resolver: demonstrationResolvers },
        { schema: documentSchema, resolver: documentResolvers },
        { schema: eventSchema, resolver: eventResolvers },
        { schema: modificationSchema, resolver: modificationResolvers },
        { schema: stateSchema, resolver: stateResolvers },
        { schema: userSchema, resolver: userResolvers },
      ];

      hasSchemaAndResolver.forEach(({ schema, resolver }) => {
        expect(typeDefs).toContain(schema);
        expect(resolvers).toContain(resolver);
      });
    });

    it("should have schemas without resolvers for reference types", () => {
      // These schemas don't need resolvers as they're typically reference types
      const schemaOnlyTypes = [
        bundleSchema,
        bundleStatusSchema,
        dateTypeSchema,
        documentTypeSchema,
        phaseSchema,
        phaseStatusSchema,
        personTypeSchema,
        roleSchema,
      ];

      schemaOnlyTypes.forEach((schema) => {
        expect(typeDefs).toContain(schema);
      });
    });

    it("should export both typeDefs and resolvers", () => {
      expect(typeDefs).toBeDefined();
      expect(resolvers).toBeDefined();
      expect(Array.isArray(typeDefs)).toBe(true);
      expect(Array.isArray(resolvers)).toBe(true);
    });
  });

  describe("error handling and edge cases", () => {
    it("should handle undefined schemas gracefully", () => {
      // All schemas should be defined, but test the structure is maintained
      typeDefs.forEach((schema) => {
        expect(schema).toBeDefined();
        expect(schema).not.toBeNull();
      });
    });

    it("should handle undefined resolvers gracefully", () => {
      // All resolvers should be defined, but test the structure is maintained
      resolvers.forEach((resolver) => {
        expect(resolver).toBeDefined();
        expect(resolver).not.toBeNull();
        expect(typeof resolver).toBe("object");
      });
    });

    it("should maintain consistent array structure", () => {
      expect(Array.isArray(typeDefs)).toBe(true);
      expect(Array.isArray(resolvers)).toBe(true);
      expect(typeDefs.length).toBeGreaterThan(0);
      expect(resolvers.length).toBeGreaterThan(0);
    });
  });
});