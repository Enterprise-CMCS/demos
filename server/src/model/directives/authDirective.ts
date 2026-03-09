import { prisma } from "../../prismaClient";
import { DirectiveConfiguration, ResolverProps } from "./authenticationDirectiveTransformer";
import { DirectiveAnnotation } from "@graphql-tools/utils";

const name = "auth";

const checkAuthorization = async (
  resolverProps: Pick<ResolverProps, "context">,
  directive: Pick<DirectiveAnnotation, "args">
) => {
  const requiredPermissions = directive.args?.permissions || [];
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
        permissionId: { in: requiredPermissions },
      },
    })
  ).map((rolePermission) => rolePermission.permissionId);

  return userPermissions.length > 0;
};

export const authDirective: DirectiveConfiguration = {
  name,
  checkAuthorization,
};
