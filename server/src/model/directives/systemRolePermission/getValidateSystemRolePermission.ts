import { prisma } from "../../../prismaClient";
import { AuthorizationCheckFunction, ResolverProps } from "../authenticationDirectiveTransformer";

export const getCheckAuthorization = (permissionName: string): AuthorizationCheckFunction => {
  return async (resolverProps: Pick<ResolverProps, "context">) => {
    const userRoles = (
      await prisma().systemRoleAssignment.findMany({
        where: {
          personId: resolverProps.context.user?.id,
        },
      })
    ).map((roleAssignment) => roleAssignment.roleId);

    const userPermissions = (
      await prisma().rolePermission.findMany({
        where: {
          roleId: {
            in: userRoles,
          },
        },
      })
    ).map((rolePermission) => rolePermission.permissionId);

    return userPermissions.includes(permissionName);
  };
};
