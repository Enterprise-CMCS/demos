import { DocumentType } from "../../constants";
import { documentPendingUploadResolvers } from "../../model/documentPendingUpload/documentPendingUploadResolvers";
import { GraphQLContext } from "../../auth";
import { createAndUploadFileToS3 } from "./createAndUploadFileToS3";

export const uploadDocumentToDeliverableStateFiles = async ({
  name,
  description,
  documentContentText,
  applicationId,
  deliverableId,
  documentType,
  context,
}: {
  name: string;
  description: string;
  documentContentText: string;
  applicationId: string;
  deliverableId: string;
  documentType: DocumentType;
  context: GraphQLContext;
}) => {
  const documentPendingUpload =
    await documentPendingUploadResolvers.Mutation.uploadDocumentToDeliverableCMSFiles(
      null,
      {
        input: {
          name,
          description,
          documentType,
          applicationId,
          deliverableId,
        },
      },
      context
    );
  const presignedUploadUrl =
    await documentPendingUploadResolvers.DocumentPendingUpload.presignedUploadUrl(
      documentPendingUpload
    );

  await createAndUploadFileToS3({
    documentPendingUploadId: documentPendingUpload.id,
    fileContentText: documentContentText,
    presignedUploadUrl,
    context,
  });
};
