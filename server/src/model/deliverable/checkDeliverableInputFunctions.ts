import {
  Demonstration as PrismaDemonstration,
  DemonstrationTypeTagAssignment as PrismaDemonstrationTypeTagAssignment,
  User as PrismaUser,
} from "@prisma/client";
import { ApplicationStatus, PersonType, TagName } from "../../types";

export function checkDemonstrationStatus(demonstration: PrismaDemonstration): string | undefined {
  const approvedStatus: ApplicationStatus = "Approved";
  if (demonstration.statusId !== approvedStatus) {
    return `Demonstration ${demonstration.id} is not in Approved status; cannot create deliverable.`;
  }
}

export function checkOwnerPersonType(ownerUser: PrismaUser): string | undefined {
  const permittedOwnerPersonTypes: readonly PersonType[] = ["demos-admin", "demos-cms-user"];
  if (!permittedOwnerPersonTypes.includes(ownerUser.personTypeId as PersonType)) {
    return `User ${ownerUser.id} is not a CMS user; cannot own deliverable.`;
  }
}

export function checkRequestedDeliverableDemonstrationType(
  requestedDeliverableDemonstrationType: TagName,
  demonstrationTypeTagAssignments: PrismaDemonstrationTypeTagAssignment[],
  demonstration: PrismaDemonstration
): string | undefined {
  const demonstrationId = demonstration.id;
  const existingDemonstrationTypes = demonstrationTypeTagAssignments.map(
    (assignment) => assignment.tagNameId
  ) as TagName[];
  if (!existingDemonstrationTypes.includes(requestedDeliverableDemonstrationType)) {
    return (
      `Demonstration Type ${requestedDeliverableDemonstrationType} does not exist on ` +
      `demonstration ${demonstrationId}; cannot be assigned to deliverable.`
    );
  }
}
