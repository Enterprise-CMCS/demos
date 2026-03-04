import { prisma } from "../../../prismaClient";
import { ResolverProps } from "../authenticationDirectiveTransformer";

export const getCheckAuthorization = (permissionName: string) => {
  return async (resolverContext: ResolverProps) => {
    const { context } = resolverContext;

    const userRoles = (
      await prisma().systemRoleAssignment.findMany({
        where: {
          personId: context.user?.id,
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
