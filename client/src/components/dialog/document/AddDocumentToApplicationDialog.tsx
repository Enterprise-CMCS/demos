import React from "react";
import { gql, useApolloClient, TypedDocumentNode } from "@apollo/client";

import {
  DocumentType,
  DocumentPendingUpload,
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

export const UPLOAD_DOCUMENT_QUERY: TypedDocumentNode<
  { uploadDocumentToApplication: Pick<DocumentPendingUpload, "presignedUploadUrl" | "id"> },
  { input: UploadDocumentToApplicationInput }
> = gql`
  mutation UploadDocumentToApplication($input: UploadDocumentToApplicationInput!) {
    uploadDocumentToApplication(input: $input) {
      id
      presignedUploadUrl
    }
  }
`;

interface AddDocumentToApplicationDialogProps {
  onClose: () => void;
  applicationId: string;
  documentTypeSubset?: DocumentType[];
  titleOverride?: string;
  refetchQueries?: string[];
  onDocumentUploadSucceeded?: (payload?: UploadDocumentToApplicationInput) => void;
}

export const AddDocumentToApplicationDialog: React.FC<AddDocumentToApplicationDialogProps> = ({
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
  const { uploadDocument } = useUploadDocument(UPLOAD_DOCUMENT_QUERY);
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

    const uploadResult = (await uploadDocument(uploadDocumentInput)).uploadDocumentToApplication;

    // Upload the file to presigned URL
    const response = await tryUploadingFileToS3(uploadResult.presignedUploadUrl, dialogFields.file);
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    // Check for virus scan results and early return if failed
    const isDocumentClean = await documentPassedVirusScan(uploadResult.id);
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
