import { Prisma, Document as PrismaDocument } from "@prisma/client";
import { PrismaTransactionClient } from "../../prismaClient";
import { getS3Adapter } from "../../adapters/s3/S3Adapter";
import { deleteDocument } from "./queries/deleteDocument";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "../../constants";
import { deleteBudgetNeutralityWorkbook } from "../budgetNeutralityWorkbook/queries";

export async function handleDeleteDocument(
  where: Prisma.DocumentWhereUniqueInput,
  tx: PrismaTransactionClient
): Promise<PrismaDocument> {
  const document = await deleteDocument(where, tx);
  if (document.documentTypeId === BN_WORKBOOK_DOCUMENT_TYPE) {
    await deleteBudgetNeutralityWorkbook({ id: document.id }, tx);
  }
  const key = `${document.applicationId}/${document.id}`;

  const s3Adapter = getS3Adapter();
  await s3Adapter.moveDocumentFromCleanToDeleted(key);
  return document;
}
