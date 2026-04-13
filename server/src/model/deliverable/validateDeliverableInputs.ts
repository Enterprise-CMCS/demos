import {
  checkDemonstrationStatus,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  ParsedCreateDeliverableInput,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient.js";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
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

  const errors: (string | undefined)[] = [];
  errors.push(checkDemonstrationStatus(demonstration));
  errors.push(checkOwnerPersonType(cmsOwnerUser));
  for (const requestedDeliverableDemonstrationType of input.demonstrationTypes ?? []) {
    errors.push(
      checkRequestedDeliverableDemonstrationType(
        requestedDeliverableDemonstrationType,
        demonstrationTypeAssignments,
        demonstration
      )
    );
  }
  const cleanedErrors = errors.filter((e) => e !== undefined);

  if (cleanedErrors.length > 0) {
    throw new GraphQLError("One or more validation checks for createDeliverable have failed.", {
      extensions: {
        code: "CREATE_DELIVERABLE_VALIDATION_FAILED",
        originalMessages: cleanedErrors,
      },
    });
  }
}
