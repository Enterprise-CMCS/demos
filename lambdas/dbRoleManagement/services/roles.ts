import {
  loginRolesNotInDb,
  deleteRoles,
  syncRoleMemberships,
  createRole,
  validateRolesExist,
} from "../database/queries";
import { Role } from "../types";
import { getStage } from "../util/env";
import { generateTempPassword } from "../util/password";
import { hasDuplicates, isValidRoleName } from "../util/validation";
import { deleteSecureStrings, storeSecureString } from "./parameters";
import { deleteSecrets, storeSecret } from "./secrets";

export async function applyRoleChanges(roleList: Role[], oldRoleList?: Role[]) {
  if (oldRoleList) {
    const deletedRoleNames = findDeletedRoleNames(roleList, oldRoleList);
    await deleteRoles(deletedRoleNames);

    const standardRoles = deletedRoleNames.filter((r) => !r.systemRole);
    await deleteSecureStrings(
      getStage(),
      standardRoles.map((r) => r.name)
    );

    // TODO: fix inconsistency between deleteSecrets and deleteSecureStrings params
    const systemRoles = deletedRoleNames.filter((r) => r.systemRole);
    await deleteSecrets(systemRoles);
  }

  await validateRoleInput(roleList);

  const newRoles = await loginRolesNotInDb(roleList);
  if (newRoles.length != 0) {
    console.log(`${newRoles.length} new roles(s) found`);
    await provisionRoles(newRoles);
  }

  for (const role of roleList) {
    await syncRoleMemberships(role);
  }
}

export const provisionRoles = async (roleList: Role[]) => {
  for (const role of roleList) {
    const password = generateTempPassword();
    await createRole(role, password);

    if (role.systemRole) {
      await storeSecret(getStage(), role.name, password); // TODO: Modular env name
    } else {
      await storeSecureString(getStage(), role.name, password); // TODO: Modular env name
    }
  }
};

export function findDeletedRoleNames(roleList: Role[], oldRoleList: Role[]) {
  const deletedRoles: Role[] = [];

  for (const oldRole of oldRoleList) {
    if (!roleList.some((r) => r.name === oldRole.name)) {
      deletedRoles.push(oldRole);
    }
  }

  return deletedRoles;
}

export async function validateRoleInput(roleList: Role[]) {
  const allMemberRoles = [...new Set(roleList.map((r) => r.memberships).flat())];
  const invalidMemberRoleNames = allMemberRoles.filter((r) => !isValidRoleName(r));
  if (invalidMemberRoleNames.length != 0) {
    throw new Error(`invalid member role names: ${invalidMemberRoleNames.join(", ")}`);
  }

  const invalidRoleNames = roleList.filter((r) => !isValidRoleName(r.name)).map((r) => r.name);
  if (invalidRoleNames.length > 0) {
    throw new Error(`invalid role names: ${invalidRoleNames.join(", ")}`);
  }

  if (hasDuplicates(roleList.map((r) => r.memberships))) {
    throw new Error(`duplicate role names listed`);
  }

  await validateRolesExist(allMemberRoles);
}

export async function deleteAllRoles(roleList: Role[]) {
  await deleteRoles(roleList);
  const standardRoles = roleList.filter((r) => !r.systemRole);
  await deleteSecureStrings(
    getStage(),
    standardRoles.map((r) => r.name)
  );

  // System roles only
  const systemRoles = roleList.filter((r) => r.systemRole);
  await deleteSecrets(systemRoles);
}
