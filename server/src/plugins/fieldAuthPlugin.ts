import {
  visit,
  TypeInfo,
  visitWithTypeInfo,
  DocumentNode,
  GraphQLSchema,
  isIntrospectionType,
  GraphQLField,
} from "graphql";

import { getDirective } from "@graphql-tools/utils";

import type { GraphQLContext } from "../auth/auth.util";
import { prisma } from "../prismaClient";
import { Permission } from "../types";

const getApplicablePermissions = (
  schema: GraphQLSchema,
  fieldDef: GraphQLField<unknown, unknown>
): Permission => {
  const authDirectives = getDirective(schema, fieldDef, "auth");
  // Schema validation ensures this exists and has a valid "requires" value
  return authDirectives![0]["requires"];
};

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
 * Validates that all fields in a GraphQL document are accessible with the given permissions.
 * Exported for testing purposes.
 * @throws Error if any field is not accessible
 */
export const validateDocumentPermissions = (
  document: DocumentNode,
  schema: GraphQLSchema,
  userPermissions: Permission[]
): void => {
  const typeInfo = new TypeInfo(schema);
  visit(
    document,
    visitWithTypeInfo(typeInfo, {
      Field() {
        const fieldDef = typeInfo.getFieldDef();
        const parentType = typeInfo.getParentType();

        if (
          !fieldDef ||
          !parentType ||
          fieldDef.name.startsWith("__") ||
          isIntrospectionType(parentType)
        ) {
          return;
        }

        const permission: Permission = getApplicablePermissions(schema, fieldDef);
        const hasPermission = userPermissions.includes(permission);

        if (!hasPermission) {
          throw new Error(
            `Unauthorized: You do not have permission to access field "${fieldDef.name}" of type "${parentType.name}"`
          );
        }
      },
    })
  );
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
