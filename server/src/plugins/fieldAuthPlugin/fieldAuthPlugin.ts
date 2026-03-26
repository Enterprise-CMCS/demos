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

import type { GraphQLContext } from "../../auth/auth.util";
import { prisma } from "../../prismaClient";
import { Permission } from "../../types";

const getUserPermissions = async (userId: string): Promise<Permission[]> => {
  const userRoles = (
    await prisma().systemRoleAssignment.findMany({
      where: { personId: userId },
      include: { role: true },
    })
  ).map((assignment) => assignment.roleId);

  const userPermissions = (
    await prisma().rolePermission.findMany({
      where: { roleId: { in: userRoles } },
    })
  ).map((rolePermission) => rolePermission.permissionId);

  // casting enforced by database constraints
  return userPermissions as Permission[];
};

/**
 * Checks if a field is authorized for the given permissions.
 * Exported for testing purposes.
 * @returns error message if unauthorized, false if authorized or should be skipped
 */
export const checkFieldAuthorization = (
  schema: GraphQLSchema,
  fieldDef: GraphQLField<unknown, unknown>,
  parentType: GraphQLCompositeType,
  userPermissions: Permission[]
): string | false => {
  if (fieldDef.name.startsWith("__") || isIntrospectionType(parentType)) {
    return false;
  }

  const authDirectives = getDirective(schema, fieldDef, "auth");
  if (!authDirectives || authDirectives.length === 0) {
    return false;
  }

  const requiredPermission: Permission = authDirectives[0]["requires"];
  if (userPermissions.includes(requiredPermission)) {
    return false;
  }

  return `Unauthorized: You do not have permission to access ${parentType.name}.${fieldDef.name}.`;
};

/**
 * Validates that all fields in a GraphQL document are accessible with the given permissions.
 * Collects all authorization violations and reports them together.
 * Exported for testing purposes.
 * @throws Error with all authorization violations if any fields are not accessible
 */
export const validateDocumentPermissions = (
  document: DocumentNode,
  schema: GraphQLSchema,
  userPermissions: Permission[]
): void => {
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

        const authorizationError = checkFieldAuthorization(
          schema,
          fieldDef,
          parentType,
          userPermissions
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
};

export const fieldAuthPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext: {
        document: DocumentNode;
        contextValue: GraphQLContext;
        schema: GraphQLSchema;
      }) {
        const user = requestContext.contextValue.user;
        if (!user) {
          throw new Error("Unauthorized: No user in context");
        }

        const userPermissions: Permission[] = await getUserPermissions(user.id);
        validateDocumentPermissions(
          requestContext.document,
          requestContext.schema,
          userPermissions
        );
      },
    };
  },
};
