import { Prisma, State as PrismaState } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectState } from "./selectState";

export async function selectStateOrThrow(
  filter: Prisma.StateWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaState> {
  const state = await selectState(filter, tx);
  if (!state) {
    throw new Error("No state found matching the provided filter");
  }
  return state;
}
