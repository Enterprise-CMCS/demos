import { Prisma, Amendment as PrismaAmendment } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectAmendment } from "./selectAmendment";

export async function selectAmendmentOrThrow(
  filter: Prisma.AmendmentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment> {
  const amendment = await selectAmendment(filter, tx);
  if (!amendment) {
    throw new Error("No amendment found matching the provided filter");
  }
  return amendment;
}
