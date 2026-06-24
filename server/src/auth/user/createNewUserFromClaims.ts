import type { PrismaTransactionClient } from "../../prismaClient";
import type { Permission, SystemRole, UserType } from "../../types";
import type { ContextUser } from ".";
import type { AuthorizationClaims } from "..";

import { getPersonTypeFromClaims } from ".";
import { insertPerson } from "../../model/person/queries";
import { insertUser } from "../../model/user/queries";
import { insertSystemRoleAssignment } from "../../model/systemRoleAssignment/queries";
import { selectManyRolePermissions } from "../../model/rolePermission/queries";

const initialUserTypeRoles: Record<UserType, SystemRole> = {
  "demos-admin": "Admin User",
  "demos-cms-user": "CMS User",
  "demos-state-user": "State User",
};

export async function createNewUserFromClaims(
  claims: AuthorizationClaims,
  tx: PrismaTransactionClient
): Promise<ContextUser> {
  const newPersonTypeId = getPersonTypeFromClaims(claims);
  const person = await insertPerson(
    {
      personTypeId: newPersonTypeId,
      email: claims.email,
      firstName: claims.givenName,
      lastName: claims.familyName,
    },
    tx
  );
  await insertUser(
    {
      id: person.id,
      personTypeId: newPersonTypeId,
      cognitoSubject: claims.sub,
      username: claims.externalUserId,
      isMigratedFromPmda: false,
      hasLoggedIn: true,
    },
    tx
  );
  const systemRoleAssignment = await insertSystemRoleAssignment(
    {
      personId: person.id,
      grantLevelId: "System",
      personTypeId: newPersonTypeId,
      roleId: initialUserTypeRoles[newPersonTypeId],
    },
    tx
  );
  const permissions = await selectManyRolePermissions({ roleId: systemRoleAssignment.roleId }, tx);

  // Casts are enforced by database
  return {
    id: person.id,
    personTypeId: newPersonTypeId,
    cognitoSubject: claims.sub,
    permissions: permissions.map((rp) => rp.permissionId as Permission),
  };
}
