import { DocumentType } from "../constants";
import { generatePdf } from "./generatePdf";
import { documentPendingUploadResolvers } from "../model/documentPendingUpload/documentPendingUploadResolvers";
import { GraphQLContext } from "../auth";
import { documentResolvers } from "../model/document/documentResolvers";

const DOCUMENT_UPLOAD_POLL_INTERVAL_MS = 500;
const DOCUMENT_UPLOAD_TIMEOUT_MS = 20_000;

export const uploadDocumentToDeliverableStateFiles = async ({
  demonstrationId,
  deliverableId,
  documentOwnerUserId,
  documentType,
}: {
  demonstrationId: string;
  deliverableId: string;
  documentOwnerUserId: string;
  documentType: DocumentType;
}) => {
  const context = {
    user: {
      id: documentOwnerUserId,
      personTypeId: "demos-cms-user",
      permissions: ["View All Documents"],
    },
  } as GraphQLContext;

  const name = `${deliverableId} State Document`;

  const documentPendingUpload =
    await documentPendingUploadResolvers.Mutation.uploadDocumentToDeliverableStateFiles(
      null,
      {
        input: {
          name,
          description: `State Document for deliverable ${deliverableId} on demonstration ${demonstrationId}`,
          documentType: documentType satisfies DocumentType,
          applicationId: demonstrationId,
          deliverableId,
        },
      },
      context
    );
  const presignedUploadUrl =
    await documentPendingUploadResolvers.DocumentPendingUpload.presignedUploadUrl(
      documentPendingUpload
    );

  const file = await generatePdf(
    `This is an automatically generated placeholder PDF for document "${name}" of type Close Out Report for deliverable ${deliverableId} on demonstration ${demonstrationId}.`
  );

  const putResponse = await fetch(presignedUploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/pdf" },
  });

  if (!putResponse.ok) {
    throw new Error(
      `Failed to upload document to S3. Status: ${putResponse.status}, Response: ${await putResponse.text()}`
    );
  }

  const uploadDeadline = Date.now() + DOCUMENT_UPLOAD_TIMEOUT_MS;

  while (Date.now() < uploadDeadline) {
    try {
      return await documentResolvers.Query.document(
        undefined,
        { id: documentPendingUpload.id },
        context
      );
    } catch {
      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_UPLOAD_POLL_INTERVAL_MS));
    }
  }

  throw new Error(
    `Document ${documentPendingUpload.id} was not available within ${DOCUMENT_UPLOAD_TIMEOUT_MS}ms of upload.`
  );
};
