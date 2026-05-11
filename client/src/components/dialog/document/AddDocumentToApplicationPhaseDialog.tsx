import React from "react";
import { gql, useApolloClient, TypedDocumentNode } from "@apollo/client";

import {
  DocumentType,
  PhaseName,
  UploadDocumentResponse,
  UploadDocumentToApplicationPhaseInput,
} from "demos-server";
import {
  DocumentDialog,
  DocumentDialogFields,
  DocumentUploadResult,
} from "components/dialog/document/DocumentDialog";
import { useToast } from "components/toast/ToastContext";
import { tryUploadingFileToS3 } from "./tryUploadingFileToS3";
import { useDocumentPassedVirusScan } from "./useDocumentPassedVirusScan";
import { useUploadDocument } from "./useUploadDocument";

export const UPLOAD_DOCUMENT_QUERY: TypedDocumentNode<
  { uploadDocumentToApplicationPhase: UploadDocumentResponse },
  { input: UploadDocumentToApplicationPhaseInput }
> = gql`
  mutation UploadDocumentToApplicationPhase($input: UploadDocumentToApplicationPhaseInput!) {
    uploadDocumentToApplicationPhase(input: $input) {
      presignedURL
      documentId
    }
  }
`;

export const LOCAL_UPLOAD_PREFIX = "LocalS3Adapter";

interface AddDocumentToApplicationPhaseDialogProps {
  onClose: () => void;
  applicationId: string;
  documentTypeSubset?: DocumentType[];
  titleOverride?: string;
  refetchQueries?: string[];
  onDocumentUploadSucceeded?: (payload?: UploadDocumentToApplicationPhaseInput) => void;
  phaseName: PhaseName;
}

export const AddDocumentToApplicationPhaseDialog: React.FC<
  AddDocumentToApplicationPhaseDialogProps
> = ({
  onClose,
  applicationId,
  documentTypeSubset,
  titleOverride,
  refetchQueries,
  onDocumentUploadSucceeded,
  phaseName,
}) => {
  const { showError } = useToast();
  const client = useApolloClient();
  const { documentPassedVirusScan } = useDocumentPassedVirusScan();
  const { uploadDocument } = useUploadDocument(UPLOAD_DOCUMENT_QUERY);
  const handleDocumentUploadSucceeded = async (
    payload: UploadDocumentToApplicationPhaseInput
  ): Promise<void> => {
    onDocumentUploadSucceeded?.(payload);
    if (refetchQueries) {
      await client.refetchQueries({ include: refetchQueries });
    }
  };

  const handleUpload = async (
    dialogFields: DocumentDialogFields
  ): Promise<DocumentUploadResult> => {
    if (!dialogFields.file) {
      showError("Please select a file to upload.");
      return "unknown-error";
    }

    const uploadDocumentInput: UploadDocumentToApplicationPhaseInput = {
      applicationId,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
      phaseName,
    };

    const uploadResult = (await uploadDocument(uploadDocumentInput))
      .uploadDocumentToApplicationPhase;

    // Short-circuit: Skip S3 upload attempt and virus scan in local development
    // Hint: If you want to test an upload scenario locally such as virus scan failure,
    // simply return that DocumentUploadResult from this function
    if (uploadResult.presignedURL.startsWith(LOCAL_UPLOAD_PREFIX)) {
      await handleDocumentUploadSucceeded(uploadDocumentInput);
      return "succeeded";
    }

    // Upload the file to presigned URL
    const response = await tryUploadingFileToS3(uploadResult.presignedURL, dialogFields.file);
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    // Check for virus scan results and early return if failed
    const isDocumentClean = await documentPassedVirusScan(uploadResult.documentId);
    if (!isDocumentClean) {
      return "virus-scan-failed";
    }

    await handleDocumentUploadSucceeded(uploadDocumentInput);
    return "succeeded";
  };

  return (
    <DocumentDialog
      onClose={onClose}
      mode="add"
      onSubmit={handleUpload}
      documentTypeSubset={documentTypeSubset}
      titleOverride={titleOverride}
    />
  );
};
