import {
  checkDeliverableExtensionHasStatus,
  checkDeliverableHasAtLeastOneDocument,
  checkDeliverableHasNoActiveExtension,
  checkDeliverableHasNoComments,
  checkDeliverableHasNoDocuments,
  checkDeliverableHasStatus,
  checkDemonstrationStatus,
  checkDueDateInFuture,
  checkNewDueDateIsAtLeastCurrentDueDate,
  checkNewDueDateIsGreaterThanCurrentDueDate,
  checkOwnerPersonType,
  checkRequestedDeliverableDemonstrationType,
  checkRequiredDeliverableDemonstrationTypes,
  selectDeliverableOrThrow,
  ParsedApproveDeliverableExtensionInput,
  ParsedCreateDeliverableInput,
  ParsedRequestDeliverableExtensionInput,
  ParsedRequestDeliverableResubmissionInput,
  ParsedUpdateDeliverableInput,
} from ".";
import { PrismaTransactionClient } from "../../prismaClient";
import { getApplication } from "../application";
import { selectUserOrThrow } from "../user/queries";
import { getDemonstrationTypeAssignments } from "../demonstrationTypeTagAssignment";
import { GraphQLError } from "graphql";
import {
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { PersonType } from "../../types";
import { ACTIVE_DELIVERABLE_STATUSES } from "../../constants";

function cleanErrorsAndThrow(errors: (string | undefined)[], mutator: string, code: string): void {
  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError(`One or more validation checks for ${mutator} have failed.`, {
      extensions: {
        code: code,
        originalMessages: cleanedErrors,
      },
    });
  }
}

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
  const cmsOwnerUser = await selectUserOrThrow({ id: input.cmsOwnerUserId }, tx);
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
    checkDueDateInFuture(input.dueDate),
    checkRequiredDeliverableDemonstrationTypes(
      input.deliverableType,
      input.demonstrationTypes
    )
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
  cleanErrorsAndThrow(errors, "createDeliverable", "CREATE_DELIVERABLE_VALIDATION_FAILED");
}

export async function validateUpdateDeliverableInput(
  deliverableId: string,
  input: ParsedUpdateDeliverableInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const deliverable = await selectDeliverableOrThrow({ id: deliverableId }, tx);
  const errors: (string | undefined)[] = [];

  // Updates can be performed on all active deliverables
  errors.push(checkDeliverableHasStatus(deliverable, ACTIVE_DELIVERABLE_STATUSES));

  if (input.cmsOwnerUserId) {
    const cmsOwnerUser = await selectUserOrThrow({ id: input.cmsOwnerUserId }, tx);
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
  cleanErrorsAndThrow(errors, "updateDeliverable", "UPDATE_DELIVERABLE_VALIDATION_FAILED");
}

export async function validateSubmitDeliverableInput(
  deliverable: PrismaDeliverable,
  tx: PrismaTransactionClient
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(
    // Users may submit on all active deliverables
    checkDeliverableHasStatus(deliverable, ACTIVE_DELIVERABLE_STATUSES),
    await checkDeliverableHasAtLeastOneDocument(deliverable, tx)
  );
  cleanErrorsAndThrow(errors, "submitDeliverable", "SUBMIT_DELIVERABLE_VALIDATION_FAILED");
}

export function validateStartDeliverableReviewInput(deliverable: PrismaDeliverable): void {
  const errors: (string | undefined)[] = [];

  // Review can only be started when the deliverable is submitted
  errors.push(checkDeliverableHasStatus(deliverable, ["Submitted"]));
  cleanErrorsAndThrow(
    errors,
    "startDeliverableReview",
    "START_DELIVERABLE_REVIEW_VALIDATION_FAILED"
  );
}

export function validateCompleteDeliverableInput(deliverable: PrismaDeliverable): void {
  const errors: (string | undefined)[] = [];

  // Deliverables may only be completed from review status
  errors.push(checkDeliverableHasStatus(deliverable, ["Under CMS Review"]));
  cleanErrorsAndThrow(errors, "completeDeliverable", "COMPLETE_DELIVERABLE_VALIDATION_FAILED");
}

export function validateRequestDeliverableResubmissionInput(
  deliverable: PrismaDeliverable,
  input: ParsedRequestDeliverableResubmissionInput
): void {
  const errors: (string | undefined)[] = [];

  // Resubmissions may be requested from submitted or under review status
  errors.push(
    checkDeliverableHasStatus(deliverable, ["Submitted", "Under CMS Review"]),
    checkDueDateInFuture(input.newDueDate),
    checkNewDueDateIsAtLeastCurrentDueDate(deliverable, input.newDueDate)
  );
  cleanErrorsAndThrow(
    errors,
    "requestDeliverableResubmission",
    "REQUEST_DELIVERABLE_RESUBMISSION_VALIDATION_FAILED"
  );
}

export async function validateRequestDeliverableExtensionInput(
  deliverable: PrismaDeliverable,
  input: ParsedRequestDeliverableExtensionInput,
  tx: PrismaTransactionClient
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(
    // Extensions may only be requested prior to submission
    checkDeliverableHasStatus(deliverable, ["Upcoming", "Past Due"]),
    await checkDeliverableHasNoActiveExtension(deliverable, tx),
    checkDueDateInFuture(input.requestedDueDate),
    checkNewDueDateIsGreaterThanCurrentDueDate(deliverable, input.requestedDueDate)
  );
  cleanErrorsAndThrow(
    errors,
    "requestDeliverableExtension",
    "REQUEST_DELIVERABLE_EXTENSION_VALIDATION_FAILED"
  );
}

export function validateApproveDeliverableExtensionInput(
  deliverable: PrismaDeliverable,
  deliverableExtension: PrismaDeliverableExtension,
  input: ParsedApproveDeliverableExtensionInput
): void {
  const errors: (string | undefined)[] = [];

  errors.push(
    // Extensions may be processed for any active deliverable
    checkDeliverableHasStatus(deliverable, ACTIVE_DELIVERABLE_STATUSES),
    checkDeliverableExtensionHasStatus(deliverableExtension, ["Requested"]),
    checkDueDateInFuture(input.finalDateGranted)
  );
  cleanErrorsAndThrow(
    errors,
    "approveDeliverableExtension",
    "APPROVE_DELIVERABLE_EXTENSION_VALIDATION_FAILED"
  );
}

export function validateDenyDeliverableExtensionInput(
  deliverable: PrismaDeliverable,
  deliverableExtension: PrismaDeliverableExtension
): void {
  const errors: (string | undefined)[] = [];

  errors.push(
    // Extensions may be processed for any active deliverable
    checkDeliverableHasStatus(deliverable, ACTIVE_DELIVERABLE_STATUSES),
    checkDeliverableExtensionHasStatus(deliverableExtension, ["Requested"])
  );
  cleanErrorsAndThrow(
    errors,
    "denyDeliverableExtension",
    "DENY_DELIVERABLE_EXTENSION_VALIDATION_FAILED"
  );
}

export async function validateDeleteDeliverableInput(
  deliverable: PrismaDeliverable,
  tx: PrismaTransactionClient
): Promise<void> {
  const errors: (string | undefined)[] = [];

  errors.push(
    // Extensions may be processed for any active deliverable
    checkDeliverableHasStatus(deliverable, ["Upcoming", "Past Due"]),
    await checkDeliverableHasNoDocuments(deliverable, tx),
    await checkDeliverableHasNoComments(deliverable, tx)
  );
  cleanErrorsAndThrow(errors, "deleteDeliverable", "DELETE_DELIVERABLE_VALIDATION_FAILED");
}
