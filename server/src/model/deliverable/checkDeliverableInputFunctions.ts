import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { PrismaTransactionClient } from "../../prismaClient";
import { ApplicationStatus, DeliverableStatus, PersonType, TagName } from "../../types";
import { findDuplicates } from "../../validationUtilities";
import { EasternTZDate, getEasternNow } from "../../dateUtilities";
import { selectManyDocuments } from "../document";

export function checkDemonstrationStatus(demonstration: PrismaDemonstration): string | undefined {
  const approvedStatus: ApplicationStatus = "Approved";
  if (demonstration.statusId !== approvedStatus) {
    return `Demonstration ${demonstration.id} is not in Approved status; cannot create deliverable.`;
  }
}

export function checkDeliverableStatusNotFinalized(
  deliverable: PrismaDeliverable
): string | undefined {
  // Cast enforced by DB constraints
  const deliverableStatus = deliverable.statusId as DeliverableStatus;
  const finalDeliverableStatuses: DeliverableStatus[] = [
    "Approved",
    "Accepted",
    "Received and Filed",
  ];
  if (finalDeliverableStatuses.includes(deliverableStatus)) {
    return `Cannot submit or modify deliverable ${deliverable.id} as it has already been finalized.`;
  }
}

export function checkOwnerPersonType(ownerUser: PrismaUser): string | undefined {
  const permittedOwnerPersonTypes: readonly PersonType[] = ["demos-admin", "demos-cms-user"];
  // Cast enforced by DB constraints
  if (!permittedOwnerPersonTypes.includes(ownerUser.personTypeId as PersonType)) {
    return `User ${ownerUser.id} is not a CMS user; cannot own deliverable.`;
  }
}

export function checkRequestedDeliverableDemonstrationType(
  requestedDeliverableDemonstrationType: TagName,
  demonstrationTypeTagAssignments: PrismaDemonstrationTypeTagAssignment[],
  demonstrationId: string
): string | undefined {
  const existingDemonstrationTypes = demonstrationTypeTagAssignments.map(
    (assignment) => assignment.tagNameId
  ) as TagName[];
  if (!existingDemonstrationTypes.includes(requestedDeliverableDemonstrationType)) {
    return (
      `Demonstration type ${requestedDeliverableDemonstrationType} does not exist on ` +
      `demonstration ${demonstrationId}; cannot be assigned to deliverable.`
    );
  }
}

export function checkForDuplicateDemonstrationTypes(input: TagName[]): string | undefined {
  const duplicates = findDuplicates(input);
  if (duplicates.length > 0) {
    return `Duplicate demonstration types were included on the input: ${duplicates.join(", ")}.`;
  }
}

export function checkDueDateInFuture(dueDate: EasternTZDate): string | undefined {
  const easternNow = getEasternNow()["Current Time"];
  if (dueDate.easternTZDate.valueOf() < easternNow.easternTZDate.valueOf()) {
    return `Cannot request a due date in the past; requested ${dueDate.easternTZDate}`;
  }
}

export async function checkDeliverableHasAtLeastOneDocument(
  deliverable: PrismaDeliverable,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const deliverableDocuments = await selectManyDocuments(
    { deliverableId: deliverable.id, deliverableIsCmsAttachedFile: false },
    tx
  );

  if (deliverableDocuments.length === 0) {
    return `Cannot submit deliverable ${deliverable.id} because it has no state documents attached.`;
  }
}

export function checkDeliverableHasStatus(
  deliverable: PrismaDeliverable,
  expectedStatus: DeliverableStatus
): string | undefined {
  // Cast enforced by database constraints
  const deliverableStatus = deliverable.statusId as DeliverableStatus;
  if (deliverableStatus !== expectedStatus) {
    return `Deliverable expected to have status ${expectedStatus}; actual status was ${deliverableStatus}.`;
  }
}
