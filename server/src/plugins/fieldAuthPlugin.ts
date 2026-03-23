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

const getApplicablePermissions = (
  schema: GraphQLSchema,
  fieldDef: GraphQLField<unknown, unknown>
): string[] => {
  const authDirectives = getDirective(schema, fieldDef, "auth");

  if (!authDirectives || authDirectives.length === 0) {
    throw new Error(`Unauthorized: Field "${fieldDef.name}" is missing @auth directive`);
  }

  const permissions = authDirectives[0]?.["permissions"];

  if (!Array.isArray(permissions)) {
    throw new Error(
      `Unauthorized: Field "${fieldDef.name}" has invalid @auth directive configuration`
    );
  }

  return permissions;
};

const getUserPermissions = async (userId: string): Promise<string[]> => {
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

  return userPermissions;
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

        const document = requestContext.document;
        const schema = requestContext.schema;

        const userPermissions = await getUserPermissions(user.id);

        const typeInfo = new TypeInfo(schema);
        visit(
          document,
          visitWithTypeInfo(typeInfo, {
            Field() {
              const fieldDef = typeInfo.getFieldDef();
              if (!fieldDef) {
                throw new Error("Unexpected error: No field definition found");
              }

              const parentType = typeInfo.getParentType();
              if (!parentType) {
                throw new Error("Unexpected error: No parent type found for field");
              }

              if (isIntrospectionType(parentType)) {
                return;
              }

              const applicablePermissions = getApplicablePermissions(schema, fieldDef);
              const hasPermission = applicablePermissions.some((permission) =>
                userPermissions.includes(permission)
              );

              if (!hasPermission) {
                throw new Error(
                  `Unauthorized: You do not have permission to access field "${fieldDef.name}" of type "${parentType.name}"`
                );
              }
            },
          })
        );
      },
    };
  },
};
