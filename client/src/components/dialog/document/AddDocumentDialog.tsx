import React from "react";
import { gql, useLazyQuery, useMutation, useApolloClient } from "@apollo/client";

import { DocumentType, PhaseName, UploadDocumentInput } from "demos-server";
import {
  DocumentDialog,
  DocumentDialogFields,
  DocumentDialogState,
} from "components/dialog/document/DocumentDialog";
import { useToast } from "components/toast/ToastContext";
import { DOCUMENT_UPLOADED_MESSAGE } from "util/messages";

export const UPLOAD_DOCUMENT_QUERY = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      presignedURL
      documentId
    }
  }
`;

export const DOCUMENT_EXISTS_QUERY = gql`
  query DocumentExists($documentId: ID!) {
    documentExists(documentId: $documentId)
  }
`;

export const VIRUS_SCAN_MAX_ATTEMPTS = 10;
export const DOCUMENT_POLL_INTERVAL_MS = 2_000;
export const LOCAL_UPLOAD_PREFIX = "LocalS3Adapter";

/**
 * @internal - Exported for testing only
 */
export const tryUploadingFileToS3 = async (
  presignedURL: string,
  file: File
): Promise<{ success: boolean; errorMessage: string }> => {
  try {
    const putResponse = await fetch(presignedURL, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (putResponse.ok) {
      return { success: true, errorMessage: "" };
    } else {
      const errorText = await putResponse.text();
      return { success: false, errorMessage: `Failed to upload file: ${errorText}` };
    }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "Network error during upload";
    return { success: false, errorMessage: errorText };
  }
};

interface AddDocumentDialogProps {
  onClose: () => void;
  applicationId: string;
  documentTypeSubset?: DocumentType[];
  titleOverride?: string;
  refetchQueries?: string[];
  phaseName?: PhaseName;
  onDocumentUploadSucceeded?: () => void;
}

export const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
  onClose,
  applicationId,
  documentTypeSubset,
  titleOverride,
  refetchQueries,
  phaseName = "None",
  onDocumentUploadSucceeded,
}) => {
  const { showError, showSuccess } = useToast();
  const client = useApolloClient();
  const [uploadDocumentTrigger] = useMutation(UPLOAD_DOCUMENT_QUERY);

  const [checkDocumentExists] = useLazyQuery(DOCUMENT_EXISTS_QUERY, {
    fetchPolicy: "network-only",
  });

  const waitForVirusScan = async (
    documentId: string,
    setDocumentDialogState: (documentDialogState: DocumentDialogState) => void
  ): Promise<void> => {
    for (let attempt = 0; attempt < VIRUS_SCAN_MAX_ATTEMPTS; attempt++) {
      const { data } = await checkDocumentExists({
        variables: { documentId },
      });

      if (data?.documentExists === true) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_INTERVAL_MS));
    }

    setDocumentDialogState("virus-scan-failed");
    throw new Error("Waiting for virus scan timed out");
  };

  const handleDocumentUploadSucceeded = async (): Promise<void> => {
    showSuccess(DOCUMENT_UPLOADED_MESSAGE);
    onDocumentUploadSucceeded?.();
    if (refetchQueries) {
      await client.refetchQueries({ include: refetchQueries });
    }
  };

  const handleUpload = async (
    dialogFields: DocumentDialogFields,
    setDocumentDialogState: (documentDialogState: DocumentDialogState) => void
  ): Promise<void> => {
    if (!dialogFields.file) {
      showError("Please select a file to upload.");
      return;
    }

    const uploadDocumentInput: UploadDocumentInput = {
      applicationId,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
      phaseName,
    };

    const uploadDocumentResponse = await uploadDocumentTrigger({
      variables: { input: uploadDocumentInput },
    });

    if (uploadDocumentResponse.errors?.length) {
      throw new Error(uploadDocumentResponse.errors[0].message);
    }

    const uploadResult = uploadDocumentResponse.data?.uploadDocument;
    if (!uploadResult) {
      throw new Error("Upload response from the server was empty");
    }

    // Local development mode - skip S3 upload and virus scan
    if (uploadResult.presignedURL.startsWith(LOCAL_UPLOAD_PREFIX)) {
      await handleDocumentUploadSucceeded();
      return;
    }

    if (!uploadResult.presignedURL) {
      throw new Error("Could not get presigned URL from the server");
    }

    const response = await tryUploadingFileToS3(uploadResult.presignedURL, dialogFields.file);
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    await waitForVirusScan(uploadResult.documentId, setDocumentDialogState);
    await handleDocumentUploadSucceeded();
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
