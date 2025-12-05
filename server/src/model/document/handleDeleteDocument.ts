import { Document as PrismaDocument } from "@prisma/client";
import { S3Adapter } from "../../adapters/s3/S3Adapter";
import { PrismaTransactionClient } from "../../prismaClient";
import { deleteDocumentById } from "./queries/deleteDocumentById";

export async function handleDeleteDocument(
  tx: PrismaTransactionClient,
  s3Adapter: S3Adapter,
  id: string
): Promise<PrismaDocument> {
  const document = await deleteDocumentById(tx, id);
  const key = `${document.applicationId}/${document.id}`;
  await s3Adapter.moveDocumentFromCleanToDeleted(key);
  return document;
}
