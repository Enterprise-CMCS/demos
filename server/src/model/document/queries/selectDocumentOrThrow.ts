import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../../prismaClient";
import { selectDocument } from "./selectDocument";

export async function selectDocumentOrThrow(
  filter: Prisma.DocumentWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaDocument> {
  const document = await selectDocument(filter, tx);
  if (!document) {
    throw new Error("No document found matching the provided filter");
  }
  return document;
}
