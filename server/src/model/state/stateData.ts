import { Prisma, State as PrismaState } from "@prisma/client";
import { selectState, selectManyStates } from "./queries";
import { PrismaTransactionClient } from "../../prismaClient";

export async function getState(
  where: Prisma.StateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaState | null> {
  return await selectState(where, tx);
}

export async function getManyStates(
  where: Prisma.StateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaState[]> {
  return await selectManyStates(where, tx);
}
