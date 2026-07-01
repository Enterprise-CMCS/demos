import type { User as PrismaUser } from "@prisma/client";
import type { PrismaTransactionClient } from "../../prismaClient";
import { selectManyUsers } from "../../model/user/queries";

type FindMigratedUserResultType = "Exactly One Match" | "No Match" | "More Than One Match";
export type FindMigratedUserResult = {
  users: PrismaUser[];
  resultType: FindMigratedUserResultType;
};

export async function findNewlyMigratedUserByEmail(
  email: string,
  tx: PrismaTransactionClient
): Promise<FindMigratedUserResult> {
  const users = await selectManyUsers(
    { person: { email: email }, isMigratedFromPmda: true, hasLoggedIn: false },
    tx
  );

  let resultType: FindMigratedUserResultType;
  if (users.length === 0) {
    resultType = "No Match";
  } else if (users.length > 1) {
    resultType = "More Than One Match";
  } else {
    resultType = "Exactly One Match";
  }

  return {
    users: users,
    resultType: resultType,
  };
}
