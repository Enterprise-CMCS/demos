import { getS3Adapter } from "../adapters";
import { GraphQLContext } from "../auth";
import { DocumentType, PhaseName } from "../constants";
import { documentResolvers } from "../model/document/documentResolvers";
import { documentPendingUploadResolvers } from "../model/documentPendingUpload/documentPendingUploadResolvers";
import { generatePdf } from "./generatePdf";

const DOCUMENT_POLL_INTERVAL_MS = 500;
const DOCUMENT_POLL_TIMEOUT_MS = 20_000;

export const uploadDocumentToPhase = async (
  applicationId: string,
  phaseName: PhaseName,
  documentType: DocumentType,
  ownerUserId: string
) => {
  const context = {
    user: { id: ownerUserId, permissions: ["View All Documents"] },
  } as GraphQLContext;

  const name = `${applicationId} Document`;
  const documentPendingUpload = await documentPendingUploadResolvers.Mutation.uploadDocumentToPhase(
    null,
    {
      input: {
        name,
        description: `Document "${name}" of type ${documentType} for ${phaseName} phase`,
        documentType,
        applicationId,
        phaseName,
      },
    },
    context
  );

  const s3Adapter = getS3Adapter();
  const putResponse = await fetch(await s3Adapter.getPresignedUploadUrl(documentPendingUpload.id), {
    method: "PUT",
    body: await generatePdf(
      `This is an automatically generated placeholder PDF for document "${name}" of type ${documentType} for ${phaseName} phase on application ${applicationId}.`
    ),
    headers: { "Content-Type": "application/pdf" },
  });
  if (!putResponse.ok) {
    throw new Error(
      `Failed to upload document to S3. Status: ${putResponse.status}, Message: ${await putResponse.text()}`
    );
  }

  const deadline = Date.now() + DOCUMENT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      return await documentResolvers.Query.document(
        null,
        { id: documentPendingUpload.id },
        context
      );
    } catch {
      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_INTERVAL_MS));
    }
  }

  throw new Error(
    `Timed out waiting ${DOCUMENT_POLL_TIMEOUT_MS}ms for document ${documentPendingUpload.id} to become queryable.`
  );
};
