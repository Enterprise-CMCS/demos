import React from "react";
import { gql, useLazyQuery, useMutation } from "@apollo/client";

import { DocumentType, PhaseName, UploadDocumentInput } from "demos-server";
import { DocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
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

const VIRUS_SCAN_MAX_ATTEMPTS = 10;
const DOCUMENT_POLL_INTERVAL_MS = 1_000;
const LOCALHOST_URL_PREFIX = "http://localhost";

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
  const { showError } = useToast();
  const [uploadDocumentTrigger] = useMutation(UPLOAD_DOCUMENT_QUERY, {
    refetchQueries,
  });

  const [checkDocumentExists] = useLazyQuery(DOCUMENT_EXISTS_QUERY, {
    fetchPolicy: "network-only",
  });

  const defaultDocumentType: DocumentType | undefined = documentTypeSubset?.[0];

  const defaultDocument: DocumentDialogFields = {
    file: null,
    id: "",
    name: "",
    description: "",
    documentType: defaultDocumentType,
  };

  const waitForVirusScan = async (documentId: string): Promise<void> => {
    console.debug(`[AddDocumentDialog] Starting virus scan polling for document: ${documentId}`);
    for (let attempt = 0; attempt < VIRUS_SCAN_MAX_ATTEMPTS; attempt++) {
      console.debug(
        `[AddDocumentDialog] Polling attempt ${attempt + 1}/${VIRUS_SCAN_MAX_ATTEMPTS}`
      );
      const { data } = await checkDocumentExists({
        variables: { documentId },
      });

      if (data?.documentExists === true) {
        console.debug(`[AddDocumentDialog] Document exists check passed on attempt ${attempt + 1}`);
        return;
      }

      console.debug(
        `[AddDocumentDialog] Document not yet available, waiting ${DOCUMENT_POLL_INTERVAL_MS}ms before retry`
      );

      await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_INTERVAL_MS));
    }

    throw new Error("Waiting for virus scan timed out");
  };

  const handleUpload = async (dialogFields: DocumentDialogFields): Promise<void> => {
    console.debug(`[AddDocumentDialog] Starting upload for file: ${dialogFields.file?.name}`);
    if (!dialogFields.file) {
      showError("No file selected");
      return;
    }

    if (!dialogFields.documentType) {
      showError("No Document Type Selected");
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

    console.debug(
      `[AddDocumentDialog] Received presigned URL and documentId: ${uploadResult.documentId}`
    );

    // Local development mode - skip S3 upload and virus scan
    if (uploadResult.presignedURL.startsWith(LOCALHOST_URL_PREFIX)) {
      onDocumentUploadSucceeded?.();
      return;
    }

    if (!uploadResult.presignedURL) {
      throw new Error("Could not get presigned URL from the server");
    }

    console.debug(`[AddDocumentDialog] Starting S3 upload for file: ${dialogFields.file.name}`);
    const response = await tryUploadingFileToS3(uploadResult.presignedURL, dialogFields.file);
    if (!response.success) {
      console.debug(`[AddDocumentDialog] S3 upload failed: ${response.errorMessage}`);
      showError(response.errorMessage);
      throw new Error(response.errorMessage);
    }

    console.debug("[AddDocumentDialog] S3 upload successful, starting virus scan wait");
    await waitForVirusScan(uploadResult.documentId);
    console.debug("[AddDocumentDialog] Upload and virus scan completed successfully");
    onDocumentUploadSucceeded?.();
  };

  return (
    <DocumentDialog
      onClose={onClose}
      mode="add"
      onSubmit={handleUpload}
      documentTypeSubset={documentTypeSubset}
      initialDocument={defaultDocument}
      titleOverride={titleOverride}
    />
  );
};
