import type { Permission, UserType } from "../../types";
import type { AuthorizationClaims } from "..";
import type { ContextUser } from ".";

import { prisma } from "../../prismaClient";
import { upsertUserSession } from "../../model/userSession/queries";
import { createNewUserFromClaims } from ".";

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  const existingContextUser = await prisma().$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { cognitoSubject: claims.sub },
      include: {
        person: {
          include: {
            systemRoleAssignments: true,
          },
        },
      },
    });

    if (existingUser) {
      const userRoles = existingUser.person.systemRoleAssignments.map(
        (assignment) => assignment.roleId
      );

      const userRolePermissions = await tx.rolePermission.findMany({
        where: {
          roleId: {
            in: userRoles,
          },
        },
      });

      await upsertUserSession(existingUser.id, claims.authTime, tx);

      return {
        id: existingUser.id,
        cognitoSubject: existingUser.cognitoSubject!,
        // casting enforced by database constraints
        personTypeId: existingUser.personTypeId as UserType,
        permissions: userRolePermissions.map(
          (rolePermission) => rolePermission.permissionId as Permission
        ),
      };
    } else {
      return null;
    }
  });

  if (existingContextUser) {
    return existingContextUser;
  } else {
    return await createNewUserFromClaims(claims);
  }
}
