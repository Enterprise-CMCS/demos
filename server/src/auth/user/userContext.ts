import { SemVer } from "semver";
import type { ContextUser } from ".";
import { createNewUserFromClaims, findUserByClaims, linkNewlyMigratedUserFromClaims } from ".";
import type { AuthorizationClaims } from "..";
import { getFeatureFlags } from "../../flags";
import { upsertUserSession } from "../../model/userSession/queries";
import { prisma } from "../../prismaClient";

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims,
  currentVersion: SemVer
): Promise<ContextUser> {
  return await prisma().$transaction(async (tx) => {
    let result: ContextUser | null;
    result = await findUserByClaims(claims, tx);
    if (!getFeatureFlags(currentVersion).disableMigratedUserAssociation) {
      result ??= await linkNewlyMigratedUserFromClaims(claims, tx);
    }
    result ??= await createNewUserFromClaims(claims, tx);
    await upsertUserSession(result.id, claims.authTime, tx);
    return result;
  });
}
