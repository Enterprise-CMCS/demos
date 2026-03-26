import { describe, it, expect } from "vitest";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLObjectType } from "graphql";
import { typeDefs } from "../../model/graphql.js";
import { checkFieldAuthorization } from "./fieldAuthPlugin.js";
import { Permission } from "../../types.js";
import { PERMISSION_MAP } from "./permissionMap.js";

const schema = makeExecutableSchema({ typeDefs });

describe("Field-Level Authorization", () => {
  for (const [permission, types] of Object.entries(PERMISSION_MAP)) {
    describe(`Permission "${permission}"`, () => {
      for (const [typeName, allowedFields] of Object.entries(types)) {
        const demonstrationType = schema.getType(typeName) as GraphQLObjectType;
        const availableFields = demonstrationType.getFields();

        Object.entries(availableFields).forEach(([fieldName, fieldDef]) => {
          const shouldAllow = allowedFields.includes(fieldName);

          it(`${shouldAllow ? "allows" : "denies"} field "${typeName}.${fieldName}"`, () => {
            const permissions: Permission[] = [permission as Permission];
            const result = checkFieldAuthorization(
              schema,
              fieldDef,
              demonstrationType,
              permissions
            );

            if (shouldAllow) {
              expect(result).toBe(false);
            } else {
              expect(result).not.toBe(false);
              expect(result).toContain(fieldName);
            }
          });
        });
      }
    });
  }
});
