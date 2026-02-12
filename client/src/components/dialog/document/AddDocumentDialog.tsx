import React from "react";
import { gql, useLazyQuery, useMutation, useApolloClient } from "@apollo/client";

import { DocumentType, PhaseName, UploadDocumentInput } from "demos-server";
import {
  DocumentDialog,
  DocumentDialogFields,
  DocumentUploadResult,
} from "components/dialog/document/DocumentDialog";
import { useToast } from "components/toast/ToastContext";

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
  onDocumentUploadSucceeded?: (payload?: UploadDocumentInput) => void;
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
  const { showError } = useToast();
  const client = useApolloClient();
  const [uploadDocumentTrigger] = useMutation(UPLOAD_DOCUMENT_QUERY);

  const [checkDocumentExists] = useLazyQuery(DOCUMENT_EXISTS_QUERY, {
    fetchPolicy: "network-only",
  });

  const documentPassedVirusScan = async (documentId: string): Promise<boolean> => {
    for (let attempt = 0; attempt < VIRUS_SCAN_MAX_ATTEMPTS; attempt++) {
      // Check if the document exists in the documents table
      const { data } = await checkDocumentExists({
        variables: { documentId },
      });
      if (data?.documentExists === true) {
        return true;
      }

      // Wait before the next attempt
      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_INTERVAL_MS));
    }

    // Not appearing in the document for this much time is signal of failing the virus scan
    return false;
  };

  const handleDocumentUploadSucceeded = async (payload: UploadDocumentInput): Promise<void> => {
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

    const uploadDocumentInput: UploadDocumentInput = {
      applicationId,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
      phaseName,
    };

    // Get presigned URL from the server
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

    // Guard: Ensure presignedURL is present
    if (!uploadResult.presignedURL) {
      throw new Error("Could not get presigned URL from the server");
    }

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
