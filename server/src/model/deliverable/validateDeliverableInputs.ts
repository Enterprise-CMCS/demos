import { ParsedCreateDeliverableInput } from ".";
import { PrismaTransactionClient } from "../../prismaClient.js";
import { ApplicationStatus, PersonType, TagName } from "../../types";
import { getApplication } from "../application";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import { getUser } from "../user";
import { GraphQLError } from "graphql";

export async function validateCreateDeliverableInput(
  input: ParsedCreateDeliverableInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const demonstration = await getApplication(input.demonstrationId, {
    applicationTypeId: "Demonstration",
    tx: tx,
  });
  const cmsOwnerUser = await getUser({ id: input.cmsOwnerUserId }, tx);
  const demonstrationTypeAssignments = await getDemonstrationTypeAssignments(
    {
      demonstrationId: input.demonstrationId,
    },
    tx
  );

  // Enforced by database constraints
  const demonstrationStatus = demonstration.statusId as ApplicationStatus;
  const ownerUserPersonType = cmsOwnerUser.personTypeId as PersonType;
  const demonstrationTypes = demonstrationTypeAssignments.map(
    (assignment) => assignment.tagNameId
  ) as TagName[];

  const errors = [];

  if (demonstrationStatus !== "Approved") {
    errors.push(
      `Demonstration ${demonstration.id} is not in Approved status; cannot create deliverable.`
    );
  }

  const permittedOwnerPersonTypes: PersonType[] = ["demos-admin", "demos-cms-user"];
  if (!permittedOwnerPersonTypes.includes(ownerUserPersonType)) {
    errors.push(`User ${cmsOwnerUser.id} is not a CMS user; cannot own deliverable.`);
  }

  const requestedDeliverableDemonstrationTypes = input.demonstrationTypes ?? [];
  for (const requestedDeliverableDemonstrationType of requestedDeliverableDemonstrationTypes) {
    if (!demonstrationTypes.includes(requestedDeliverableDemonstrationType)) {
      errors.push(
        `Demonstration Type ${requestedDeliverableDemonstrationType} does not exist on demonstration ${demonstration.id}; cannot be assigned to deliverable.`
      );
    }
  }

  if (errors.length > 0) {
    throw new GraphQLError("One or more validation checks for createDeliverable have failed.", {
      extensions: {
        code: "CREATE_DELIVERABLE_VALIDATION_FAILED",
        originalMessages: [errors],
      },
    });
  }
}
