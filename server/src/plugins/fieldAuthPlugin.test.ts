import { describe, it, expect } from "vitest";
import { DocumentNode } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { validateDocumentPermissions } from "./fieldAuthPlugin.js";
import { typeDefs } from "../model/graphql.js";
import { Permission } from "../types.js";
import { gql } from "graphql-tag";

const schema = makeExecutableSchema({ typeDefs });

const unauthorizedError = (field: string, type: string) =>
  `Unauthorized: You do not have permission to access field "${field}" of type "${type}"`;

describe("validateDocumentPermissions", () => {
  it.each<{
    permissions: Permission[];
    document: DocumentNode;
    error?: { field: string; type: string };
  }>([
    {
      permissions: ["Query Demonstrations", "Resolve Demonstration"],
      document: gql`
        query AllowQueryWithRequiredPermissions {
          demonstrations {
            id
            name
          }
        }
      `,
    },
    {
      permissions: ["Resolve Demonstration"],
      document: gql`
        query DenyQueryWithoutTopLevelPermission {
          demonstrations {
            id
          }
        }
      `,
      error: { field: "demonstrations", type: "Query" },
    },
    {
      permissions: ["Query Demonstrations", "Resolve Demonstration"],
      document: gql`
        query DenyQueryWithoutNestedFieldPermission {
          demonstrations {
            id
            state {
              name
            }
          }
        }
      `,
      error: { field: "name", type: "State" },
    },
    {
      permissions: ["Query Demonstrations", "Resolve Demonstration", "Resolve State"],
      document: gql`
        query AllowQueryWithAllNestedPermissions {
          demonstrations {
            id
            name
            state {
              id
              name
            }
          }
        }
      `,
    },
    {
      permissions: [
        "Query Demonstrations",
        "Query States",
        "Resolve Demonstration",
        "Resolve State",
      ],
      document: gql`
        query AllowMultipleTopLevelQueries {
          demonstrations {
            id
          }
          states {
            id
          }
        }
      `,
    },
    {
      permissions: ["Query Demonstrations", "Resolve Demonstration"],
      document: gql`
        query IgnoreIntrospectionFields {
          __typename
          demonstrations {
            __typename
            id
          }
        }
      `,
    },
  ])("$document.definitions.0.name.value", ({ permissions, document, error }) => {
    if (error) {
      expect(() => validateDocumentPermissions(document, schema, permissions)).toThrow(
        unauthorizedError(error.field, error.type)
      );
    } else {
      expect(() => validateDocumentPermissions(document, schema, permissions)).not.toThrow();
    }
  });
});
