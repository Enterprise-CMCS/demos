import { prisma } from "../../../prismaClient";

export interface DeliverableListMetadata {
  id: string;
  resubmissionCount: number;
  hasOpenExtensionRequest: boolean;
  latestSubmissionDate: Date | null;
  hasFilesOrComments: boolean;
}

export async function selectDeliverableListMetadata(
  deliverableIds: string[]
): Promise<DeliverableListMetadata[]> {
  const [actions, extensions, documents, publicComments, privateComments] = await Promise.all([
    prisma().deliverableAction.groupBy({
      by: ["deliverableId", "actionTypeId"],
      where: {
        deliverableId: { in: deliverableIds },
        actionTypeId: { in: ["Requested Resubmission", "Submitted Deliverable"] },
      },
      _count: { _all: true },
      _max: { actionTimestamp: true },
    }),
    prisma().deliverableExtension.groupBy({
      by: ["deliverableId"],
      where: { deliverableId: { in: deliverableIds }, statusId: "Requested" },
    }),
    prisma().document.groupBy({
      by: ["deliverableId"],
      where: { deliverableId: { in: deliverableIds } },
    }),
    prisma().publicComment.groupBy({
      by: ["deliverableId"],
      where: { deliverableId: { in: deliverableIds } },
    }),
    prisma().privateComment.groupBy({
      by: ["deliverableId"],
      where: { deliverableId: { in: deliverableIds } },
    }),
  ]);

  const metadata = new Map<string, DeliverableListMetadata>(
    deliverableIds.map((id) => [
      id,
      {
        id,
        resubmissionCount: 0,
        hasOpenExtensionRequest: false,
        latestSubmissionDate: null,
        hasFilesOrComments: false,
      },
    ])
  );

  for (const action of actions) {
    const item = metadata.get(action.deliverableId)!;
    if (action.actionTypeId === "Requested Resubmission") {
      item.resubmissionCount = action._count._all;
    } else {
      item.latestSubmissionDate = action._max.actionTimestamp;
    }
  }
  for (const extension of extensions) {
    metadata.get(extension.deliverableId)!.hasOpenExtensionRequest = true;
  }
  for (const row of [...documents, ...publicComments, ...privateComments]) {
    if (row.deliverableId) {
      metadata.get(row.deliverableId)!.hasFilesOrComments = true;
    }
  }

  return [...metadata.values()];
}
