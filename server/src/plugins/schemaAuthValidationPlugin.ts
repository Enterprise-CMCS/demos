import { GraphQLSchema, isObjectType, isInterfaceType, isIntrospectionType } from "graphql";
import { getDirective } from "@graphql-tools/utils";
import { PERMISSIONS } from "../constants.js";

export const validateAuthDirectives = (schema: GraphQLSchema): void => {
  const errors: string[] = [];

  const typeMap = schema.getTypeMap();

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (!isObjectType(type) && !isInterfaceType(type)) continue;
    const fields = type.getFields();

    if (isIntrospectionType(type)) continue;

    for (const [fieldName, field] of Object.entries(fields)) {
      const fieldAuthDirectives = getDirective(schema, field, "auth");

      if (!fieldAuthDirectives || fieldAuthDirectives.length === 0) {
        errors.push(`Field "${typeName}.${fieldName}" is missing @auth directive`);
        continue;
      }

      for (const directive of fieldAuthDirectives) {
        const permission = directive["requires"];

        if (!permission) {
          errors.push(
            `Field "${typeName}.${fieldName}" has @auth directive without "requires" value`
          );
          continue;
        }

        if (!PERMISSIONS.includes(permission)) {
          errors.push(`Invalid permission "${permission}" on field "${typeName}.${fieldName}"`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Schema validation failed - Invalid @auth permissions found:\n${errors.join("\n")}`
    );
  }
};

export const schemaAuthValidationPlugin = {
  async serverWillStart() {
    return {
      async schemaDidLoadOrUpdate({ apiSchema }: { apiSchema: GraphQLSchema }) {
        validateAuthDirectives(apiSchema);
      },
    };
  },
};
