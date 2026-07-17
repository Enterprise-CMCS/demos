import { getS3Adapter } from "../../adapters";
import {
  FINAL_DELIVERABLE_STATUSES,
  FinalDeliverableStatus,
} from "../../constants";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { selectDeliverableOrThrow } from "../deliverable";
import { UploadDocumentToDeliverableInput } from "./documentPendingUploadSchema";

export async function handleUploadDocumentToDeliverable(
  input: UploadDocumentToDeliverableInput,
  ownerUserId: string,
  isCmsAttachedFile: boolean
) {
  checkOptionalNotNullFields(["description"], input);

  try {
    const deliverable = await selectDeliverableOrThrow({ id: input.deliverableId });
    if (FINAL_DELIVERABLE_STATUSES.includes(deliverable.statusId as FinalDeliverableStatus)) {
      throw new Error(
        `Document cannot be uploaded to Deliverable with ID ${input.deliverableId} because its in a finalized status of ${deliverable.statusId}.`
      );
    }
    return await getS3Adapter().uploadDocument({
      name: input.name,
      description: input.description,
      applicationId: input.applicationId,
      ownerUserId: ownerUserId,
      documentTypeId: input.documentType,
      deliverableId: input.deliverableId,
      deliverableIsCmsAttachedFile: isCmsAttachedFile,
      deliverableTypeId: deliverable.deliverableTypeId,
    });
  } catch (error) {
    handlePrismaError(error);
  }
}
