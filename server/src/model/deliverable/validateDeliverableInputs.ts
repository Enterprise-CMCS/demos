import {
  checkDeliverableHasAtLeastOneDocument,
  checkDeliverableHasStatus,
  checkDeliverableStatusNotFinalized,
  checkDemonstrationStatus,
  checkDueDateInFuture,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  getDeliverable,
  ParsedCreateDeliverableInput,
  ParsedUpdateDeliverableInput,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { getApplication } from "../application";
import { getUser } from "../user/queries";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import { GraphQLError } from "graphql";
import { Deliverable as PrismaDeliverable } from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { PersonType } from "../../types";

// This probably will be modified when permissions are updated more generally
// Temporary solution for deliverables
export function validateUserPersonTypeAllowed(
  context: GraphQLContext,
  action: string,
  allowedPersonTypes: PersonType[]
): void {
  const allowedType = allowedPersonTypes.includes(context.user.personTypeId);
  if (!allowedType) {
    throw new Error(
      `A user of type ${context.user.personTypeId} is not permitted to perform the action ${action}.`
    );
  }
}

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
  errors.push(
    checkDemonstrationStatus(demonstration),
    checkOwnerPersonType(cmsOwnerUser),
    checkDueDateInFuture(input.dueDate)
  );
  if (input.demonstrationTypes && input.demonstrationTypes.size > 0) {
    for (const requestedDeliverableDemonstrationType of input.demonstrationTypes) {
      errors.push(
        checkRequestedDeliverableDemonstrationType(
          requestedDeliverableDemonstrationType,
          demonstrationTypeAssignments,
          input.demonstrationId
        )
      );
    }
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

export async function validateUpdateDeliverableInput(
  deliverableId: string,
  input: ParsedUpdateDeliverableInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const deliverable = await getDeliverable({ id: deliverableId }, tx);
  const errors: (string | undefined)[] = [];

  errors.push(checkDeliverableStatusNotFinalized(deliverable));

  if (input.cmsOwnerUserId) {
    const cmsOwnerUser = await getUser({ id: input.cmsOwnerUserId }, tx);
    errors.push(checkOwnerPersonType(cmsOwnerUser));
  }

  if (input.demonstrationTypes && input.demonstrationTypes.size > 0) {
    const demonstrationTypeAssignments = await getDemonstrationTypeAssignments(
      {
        demonstrationId: deliverable.demonstrationId,
      },
      tx
    );
    for (const requestedDeliverableDemonstrationType of input.demonstrationTypes) {
      errors.push(
        checkRequestedDeliverableDemonstrationType(
          requestedDeliverableDemonstrationType,
          demonstrationTypeAssignments,
          deliverable.demonstrationId
        )
      );
    }
  }

  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError("One or more validation checks for updateDeliverable have failed.", {
      extensions: {
        code: "UPDATE_DELIVERABLE_VALIDATION_FAILED",
        originalMessages: cleanedErrors,
      },
    });
  }
}

export async function validateSubmitDeliverableInput(
  deliverable: PrismaDeliverable,
  tx: PrismaTransactionClient
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(
    checkDeliverableStatusNotFinalized(deliverable),
    await checkDeliverableHasAtLeastOneDocument(deliverable, tx)
  );

  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError("One or more validation checks for submitDeliverable have failed.", {
      extensions: {
        code: "SUBMIT_DELIVERABLE_VALIDATION_FAILED",
        originalMessages: cleanedErrors,
      },
    });
  }
}

export function validateStartDeliverableReviewInput(deliverable: PrismaDeliverable): void {
  const errors: (string | undefined)[] = [];

  errors.push(checkDeliverableHasStatus(deliverable, "Submitted"));

  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError(
      "One or more validation checks for startDeliverableReview have failed.",
      {
        extensions: {
          code: "START_DELIVERABLE_REVIEW_VALIDATION_FAILED",
          originalMessages: cleanedErrors,
        },
      }
    );
  }
}

export function validateCompleteDeliverableInput(deliverable: PrismaDeliverable): void {
  const errors: (string | undefined)[] = [];

  errors.push(checkDeliverableHasStatus(deliverable, "Under CMS Review"));

  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError("One or more validation checks for completeDeliverable have failed.", {
      extensions: {
        code: "COMPLETE_DELIVERABLE_VALIDATION_FAILED",
        originalMessages: cleanedErrors,
      },
    });
  }
}
