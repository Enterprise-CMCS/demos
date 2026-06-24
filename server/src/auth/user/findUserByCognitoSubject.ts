import type { ContextUser } from ".";
import type { UserType, Permission } from "../../types";
import type { PrismaTransactionClient } from "../../prismaClient";
import { selectManyRolePermissions } from "../../model/rolePermission/queries";
import { selectManySystemRoleAssignments } from "../../model/systemRoleAssignment";
import { selectUser } from "../../model/user/queries";

export async function findUserByCognitoSubject(
  cognitoSubject: string,
  tx: PrismaTransactionClient
): Promise<ContextUser | null> {
  const user = await selectUser({ cognitoSubject: cognitoSubject }, tx);
  if (!user) {
    return null;
  }
  const systemRoles = await selectManySystemRoleAssignments({ personId: user.id }, tx);
  const rolePermissions = await selectManyRolePermissions(
    {
      roleId: { in: systemRoles.map((sr) => sr.roleId) },
    },
    tx
  );

  // Casts enforced by database
  return {
    id: user.id,
    cognitoSubject: cognitoSubject,
    personTypeId: user.personTypeId as UserType,
    permissions: rolePermissions.map((rp) => rp.permissionId as Permission),
  };
}
