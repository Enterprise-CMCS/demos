import React from "react";
import { gql, useApolloClient, TypedDocumentNode } from "@apollo/client";

import {
  DocumentType,
  UploadDocumentResponse,
  UploadDocumentToApplicationInput,
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

export const UPLOAD_DOCUMENT_QUERY: TypedDocumentNode<{
  uploadDocument: UploadDocumentResponse;
  input: UploadDocumentToApplicationInput;
}> = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      presignedURL
      documentId
    }
  }
`;

export const LOCAL_UPLOAD_PREFIX = "LocalS3Adapter";

export const handleUploadDocument = () => {};

interface AddDocumentDialogProps {
  onClose: () => void;
  applicationId: string;
  documentTypeSubset?: DocumentType[];
  titleOverride?: string;
  refetchQueries?: string[];
  onDocumentUploadSucceeded?: (payload?: UploadDocumentToApplicationInput) => void;
}

export const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
  onClose,
  applicationId,
  documentTypeSubset,
  titleOverride,
  refetchQueries,
  onDocumentUploadSucceeded,
}) => {
  const { showError } = useToast();
  const client = useApolloClient();
  const { documentPassedVirusScan } = useDocumentPassedVirusScan();
  const { uploadDocument } =
    useUploadDocument<UploadDocumentToApplicationInput>(UPLOAD_DOCUMENT_QUERY);
  const handleDocumentUploadSucceeded = async (
    payload: UploadDocumentToApplicationInput
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

    const uploadDocumentInput: UploadDocumentToApplicationInput = {
      applicationId,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    const uploadResult = await uploadDocument(uploadDocumentInput);

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
