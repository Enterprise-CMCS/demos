import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { TagName, TagStatus } from "../../../types";

export type GetDeliverableDemonstrationTypeResult = {
  tagName: TagName;
  approvalStatus: TagStatus;
};

export async function getDeliverableDemonstrationTypes(
  deliverableId: string,
  tx?: PrismaTransactionClient
): Promise<GetDeliverableDemonstrationTypeResult[]> {
  const prismaClient = tx ?? prisma();
  const results = await prismaClient.deliverableDemonstrationType.findMany({
    where: {
      deliverableId: deliverableId,
    },
    select: {
      demonstrationTypeTagNameId: true,
      demonstrationTypeTagAssignment: {
        select: {
          tag: {
            select: {
              statusId: true,
            },
          },
        },
      },
    },
  });

  // Types enforced by database
  return results.map((result) => ({
    tagName: result.demonstrationTypeTagNameId,
    approvalStatus: result.demonstrationTypeTagAssignment.tag.statusId as TagStatus,
  }));
}
