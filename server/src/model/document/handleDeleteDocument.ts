import { Document as PrismaDocument } from "@prisma/client";
import type { ContextUser } from "../../auth";
import { PrismaTransactionClient } from "../../prismaClient";
import { S3Adapter } from "../../adapters/s3/S3Adapter";
import { deleteDocumentById } from ".";
import { validateDocumentCanBeDeleted } from "./validateDocumentCanBeDeleted";

export async function handleDeleteDocument(
  tx: PrismaTransactionClient,
  s3Adapter: S3Adapter,
  id: string,
  user?: ContextUser
): Promise<PrismaDocument> {
  const documentToDelete = await tx.document.findUnique({
    where: { id },
    include: { deliverable: { select: { statusId: true } } },
  });

  if (!documentToDelete) {
    throw new Error(`Document with ID ${id} was not found.`);
  }

  validateDocumentCanBeDeleted(documentToDelete, user);
  const document = await deleteDocumentById(tx, id);
  const key = `${document.applicationId}/${document.id}`;
  await s3Adapter.moveDocumentFromCleanToDeleted(key);
  return document;
}
