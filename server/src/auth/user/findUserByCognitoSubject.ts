import { selectUser } from "../../model/user/queries";
import { PrismaTransactionClient } from "../../prismaClient";
import { User } from "@prisma/client";

export async function findUserByCognitoSubject(
  cognitoSubject: string,
  tx: PrismaTransactionClient
): Promise<User | null> {
  return await selectUser({ cognitoSubject: cognitoSubject }, tx);
}
