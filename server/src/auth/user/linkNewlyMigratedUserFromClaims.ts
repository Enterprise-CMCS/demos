import type { ContextUser } from ".";
import type { PrismaTransactionClient } from "../../prismaClient";
import type { AuthorizationClaims } from "..";
import { findNewlyMigratedUserByEmail, findUserByClaims, getPersonTypeFromClaims } from ".";
import { log } from "../../log";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { updateUser } from "../../model/user/queries";
import { updatePerson } from "../../model/person/queries";

export async function linkNewlyMigratedUserFromClaims(
  claims: AuthorizationClaims,
  tx: PrismaTransactionClient
): Promise<ContextUser | null> {
  const findUserResult = await findNewlyMigratedUserByEmail(claims.email, tx);

  // If we found no matches, just fall through to the next step
  if (findUserResult.resultType === "No Match") {
    return null;
  }

  // If we found more than one, throw an error
  if (findUserResult.resultType === "More Than One Match") {
    const errorMessage =
      `Attempted to link Cognito subject ${claims.sub} to migrated users via email; ` +
      "more than one match was found.";
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, "USER_MIGRATION_MULTIPLE_RECORD_ERROR");
  }

  // We know there was exactly one result at this point
  const migratedUser = findUserResult.users[0];

  // Verify that the migrated user has a matching person type or throw
  const claimsPersonTypeId = getPersonTypeFromClaims(claims);
  if (migratedUser.personTypeId !== claimsPersonTypeId) {
    const errorMessage =
      `Migrated user with Cognito subject ${claims.sub} has personTypeId of ` +
      `${migratedUser.personTypeId} in DEMOS, but ${claimsPersonTypeId} in Cognito.`;
    log.error(errorMessage);
    throwCustomGQLError(errorMessage, "USER_MIGRATION_PERSON_TYPE_MISMATCH_ERROR");
  }

  // Otherwise, update and link the records
  // We take this opportunity to ensure that Cognito and DB are aligned
  await updatePerson(
    { id: migratedUser.id },
    { firstName: claims.givenName, lastName: claims.familyName },
    tx
  );
  await updateUser(
    { id: migratedUser.id },
    { cognitoSubject: claims.sub, username: claims.externalUserId, hasLoggedIn: true },
    tx
  );

  // Then, we can find the user with the claims object
  return await findUserByClaims(claims, tx);
}
