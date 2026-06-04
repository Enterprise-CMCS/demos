import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../prismaClient";
import { getS3Adapter } from "../../adapters/s3/S3Adapter";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";
import { deleteDocument } from "./queries/deleteDocument";

export async function handleDeleteDocument(
  where: Prisma.DocumentWhereUniqueInput,
  tx: PrismaTransactionClient
): Promise<PrismaDocument> {
  const s3Adapter = getS3Adapter();

  const document = await deleteDocument(where, tx);
  validateDocumentCanBeDeleted(document);
  const key = `${document.applicationId}/${document.id}`;
  await s3Adapter.moveDocumentFromCleanToDeleted(key);
  return document;
}
