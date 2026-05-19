import { getS3Adapter } from "../../adapters";
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
