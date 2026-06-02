import { Document as PrismaDocument } from "@prisma/client";
import type { ContextUser } from "../../../auth";
import { PrismaTransactionClient } from "../../../prismaClient";
import { UpdateDocumentInput } from "../../../types";
import { validateDocumentCanBeUpdated } from "../validateDocumentCanBeUpdated";

export async function updateDocument(
  tx: PrismaTransactionClient,
  id: string,
  input: UpdateDocumentInput,
  user?: ContextUser
): Promise<PrismaDocument> {
  if (user?.personTypeId === "demos-state-user") {
    const documentToUpdate = await tx.document.findUnique({
      where: { id },
      include: { deliverable: { select: { statusId: true } } },
    });

    if (!documentToUpdate) {
      throw new Error(`Document with ID ${id} was not found.`);
    }

    validateDocumentCanBeUpdated(documentToUpdate, user);
  }

  return await tx.document.update({
    where: { id: id },
    data: {
      name: input.name,
      description: input.description,
      documentTypeId: input.documentType,
    },
  });
}
