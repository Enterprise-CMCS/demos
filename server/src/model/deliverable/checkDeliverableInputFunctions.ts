import {
  Deliverable as PrismaDeliverable,
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { PrismaTransactionClient } from "../../prismaClient";
import {
  ApplicationStatus,
  DeliverableExtensionStatus,
  DeliverableStatus,
  PersonType,
  TagName,
} from "../../types";
import { findDuplicates } from "../../validationUtilities";
import { EasternTZDate, getEasternNow } from "../../dateUtilities";
import { selectManyDocuments } from "../document";
import { selectManyDeliverableExtensions } from "../deliverableExtension/queries";

export function checkDemonstrationStatus(demonstration: PrismaDemonstration): string | undefined {
  const approvedStatus: ApplicationStatus = "Approved";
  if (demonstration.statusId !== approvedStatus) {
    return `Demonstration ${demonstration.id} is not in Approved status; cannot create deliverable.`;
  }
}

export function checkDeliverableHasStatus(
  deliverable: PrismaDeliverable,
  expectedStatuses: DeliverableStatus[]
): string | undefined {
  // Cast enforced by database constraints
  const deliverableStatus = deliverable.statusId as DeliverableStatus;
  if (!expectedStatuses.includes(deliverableStatus)) {
    return (
      `Deliverable expected to have one of status ${expectedStatuses.join(", ")}; ` +
      `actual status was ${deliverableStatus}.`
    );
  }
}

export function checkDeliverableStatusNotFinalized(
  deliverable: PrismaDeliverable
): string | undefined {
  // Cast enforced by DB constraints
  const result = checkDeliverableHasStatus(deliverable, [
    "Approved",
    "Accepted",
    "Received and Filed",
  ]);
  if (result === undefined) {
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

export function checkNewDueDateIsAtLeastCurrentDueDate(
  deliverable: PrismaDeliverable,
  newDueDate: EasternTZDate
): string | undefined {
  const currentDate = deliverable.dueDate;
  if (newDueDate.easternTZDate.valueOf() < currentDate.valueOf()) {
    return `Newly requested due date cannot be less than the original due date; requested ${newDueDate.easternTZDate}.`;
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

export async function checkDeliverableHasNoActiveExtension(
  deliverable: PrismaDeliverable,
  tx: PrismaTransactionClient
): Promise<string | undefined> {
  const openExtensionRequestStatus: DeliverableExtensionStatus = "Requested";
  const deliverableExtensions = await selectManyDeliverableExtensions(
    { deliverableId: deliverable.id, statusId: openExtensionRequestStatus },
    tx
  );
  if (deliverableExtensions.length > 0) {
    return `Cannot create new extension request for deliverable ${deliverable.id} as there is already an open request.`;
  }
}
