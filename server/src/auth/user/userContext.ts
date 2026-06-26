import type { AuthorizationClaims } from "..";
import type { ContextUser } from ".";
import { prisma } from "../../prismaClient";
import { upsertUserSession } from "../../model/userSession/queries";
import { createNewUserFromClaims, findUserByClaims, linkNewlyMigratedUserFromClaims } from ".";

export async function findOrCreateContextUserFromClaims(
  claims: AuthorizationClaims
): Promise<ContextUser> {
  return await prisma().$transaction(async (tx) => {
    let result: ContextUser | null;
    result = await findUserByClaims(claims, tx);
    if (!result) {
      result = await linkNewlyMigratedUserFromClaims(claims, tx);
    }
    if (!result) {
      result = await createNewUserFromClaims(claims, tx);
    }
    await upsertUserSession(result.id, claims.authTime, tx);
    return result;
  });
}
