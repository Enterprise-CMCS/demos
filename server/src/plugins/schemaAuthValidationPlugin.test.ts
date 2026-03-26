import { describe, it, expect } from "vitest";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql } from "graphql-tag";
import { validateAuthDirectives } from "./schemaAuthValidationPlugin.js";

describe("Schema Auth Validation Plugin", () => {
  it("passes validation for schema with valid @auth directives", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        test: String @auth(requires: "Query Demonstrations")
      }
    `;

    const schema = makeExecutableSchema({ typeDefs });

    expect(() => validateAuthDirectives(schema)).not.toThrow();
  });

  it("throws error for field missing @auth directive", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        test: String
      }
    `;

    const schema = makeExecutableSchema({ typeDefs });

    expect(() => validateAuthDirectives(schema)).toThrow(
      'Field "Query.test" is missing @auth directive'
    );
  });

  it("throws error for @auth directive without requires value", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        test: String @auth
      }
    `;

    // This will fail at schema build time since requires is mandatory
    expect(() => makeExecutableSchema({ typeDefs })).toThrow();
  });

  it("throws error for invalid permission value", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        test: String @auth(requires: "Invalid Permission That Does Not Exist")
      }
    `;

    const schema = makeExecutableSchema({ typeDefs });

    expect(() => validateAuthDirectives(schema)).toThrow(
      'Invalid permission "Invalid Permission That Does Not Exist" on field "Query.test"'
    );
  });

  it("collects and reports multiple validation errors", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        noAuth: String
        invalidPerm: String @auth(requires: "Bad Permission")
        validField: String @auth(requires: "Query Demonstrations")
      }

      type Mutation {
        noAuthMutation: String
      }
    `;

    const schema = makeExecutableSchema({ typeDefs });

    try {
      validateAuthDirectives(schema);
      expect.fail("Should have thrown validation error");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('Field "Query.noAuth" is missing @auth directive');
      expect(message).toContain('Invalid permission "Bad Permission" on field "Query.invalidPerm"');
      expect(message).toContain('Field "Mutation.noAuthMutation" is missing @auth directive');
      expect(message).not.toContain("validField");
    }
  });

  it("ignores introspection types", () => {
    const typeDefs = gql`
      scalar Permission

      directive @auth(requires: Permission!) on FIELD_DEFINITION

      type Query {
        test: String @auth(requires: "Query Demonstrations")
      }
    `;

    const schema = makeExecutableSchema({ typeDefs });

    // Schema has introspection types like __Schema, __Type, etc.
    // They should not require @auth directives
    expect(() => validateAuthDirectives(schema)).not.toThrow();
  });
});
