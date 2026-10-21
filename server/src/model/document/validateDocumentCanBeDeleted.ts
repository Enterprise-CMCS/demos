import { FINAL_DELIVERABLE_STATUSES, FinalDeliverableStatus } from "../../constants";
import { prisma, PrismaTransactionClient } from "../../prismaClient";

export async function validateDocumentCanBeDeleted(
  documentId: string,
  tx?: PrismaTransactionClient
) {
  const prismaClient = tx ?? prisma();
  const document = await prismaClient.document.findUniqueOrThrow({
    where: { id: documentId },
    include: {
      deliverable: true,
    },
  });

  if (
    document.deliverable &&
    FINAL_DELIVERABLE_STATUSES.includes(document.deliverable.statusId as FinalDeliverableStatus)
  ) {
    throw new Error(
      `Document with ID ${document.id} cannot be updated because its deliverable is in a finalized status of ${document.deliverable.statusId}.`
    );
  }

  if (document.deliverableSubmissionActionId) {
    throw new Error(
      `Document with ID ${document.id} cannot be deleted because it is part of a deliverable submission.`
    );
  }
}
