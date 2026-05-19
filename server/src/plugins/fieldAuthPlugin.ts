import {
  visit,
  TypeInfo,
  visitWithTypeInfo,
  DocumentNode,
  GraphQLSchema,
  isIntrospectionType,
  GraphQLError,
  GraphQLField,
  GraphQLCompositeType,
} from "graphql";

import { getDirective } from "@graphql-tools/utils";

import type { GraphQLContext } from "../auth";
import { Permission } from "../types";
import { PERMISSIONS } from "../constants";

export const validateAuthDirectives = (authDirective: Record<"requires", Permission[]>[]) => {
  for (const directive of authDirective) {
    if (!directive.requires) {
      throw new Error("Invalid @auth directive: Missing 'requires' argument.");
    }

    const requiredPermissions = directive["requires"];
    for (const permission of requiredPermissions) {
      if (!PERMISSIONS.includes(permission)) {
        throw new Error(
          `Invalid @auth directive: 'requires' argument contains invalid permission '${permission}'.`
        );
      }
    }
  }
};

export const checkFieldAuthorization = (
  schema: GraphQLSchema,
  fieldDef: GraphQLField<unknown, unknown>,
  parentType: GraphQLCompositeType,
  userPermissions: Permission[]
): string | false => {
  const authDirectives: Record<string, Permission[]>[] | undefined = getDirective(
    schema,
    fieldDef,
    "auth"
  );
  if (!authDirectives || authDirectives.length === 0) {
    return false;
  }

  validateAuthDirectives(authDirectives);

  if (
    authDirectives.some((directive) =>
      directive.requires.some((permission) => userPermissions.includes(permission))
    )
  ) {
    return false;
  }

  return `Unauthorized: You do not have permission to access ${parentType.name}.${fieldDef.name}.`;
};

export const fieldAuthPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation({
        document,
        contextValue,
        schema,
      }: {
        document: DocumentNode;
        contextValue: GraphQLContext;
        schema: GraphQLSchema;
      }) {
        const violations: string[] = [];
        const typeInfo = new TypeInfo(schema);

        visit(
          document,
          visitWithTypeInfo(typeInfo, {
            Field() {
              const fieldDef = typeInfo.getFieldDef();
              const parentType = typeInfo.getParentType();

              if (!fieldDef || !parentType) {
                return false;
              }

              if (fieldDef.name.startsWith("__") || isIntrospectionType(parentType)) {
                return true;
              }

              const authorizationError = checkFieldAuthorization(
                schema,
                fieldDef,
                parentType,
                contextValue.user.permissions
              );

              if (authorizationError) {
                violations.push(authorizationError);
              }
            },
          })
        );

        if (violations.length > 0) {
          throw new GraphQLError(`Authorization failed with ${violations.length} violation(s)`, {
            extensions: {
              code: "FORBIDDEN",
              violations: violations.map((message) => ({
                message,
              })),
            },
          });
        }
      },
    };
  },
};
