import { Prisma, Demonstration as PrismaDemonstration } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectDemonstration } from "./selectDemonstration";

export async function selectDemonstrationOrThrow(
  filter: Prisma.DemonstrationWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration> {
  const demonstration = await selectDemonstration(filter, tx);
  if (!demonstration) {
    throw new Error("No demonstration found matching the provided filter");
  }
  return demonstration;
}
