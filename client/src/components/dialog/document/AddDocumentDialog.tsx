import React from "react";
import { gql, useMutation } from "@apollo/client";

import { DocumentType, PhaseName, UploadDocumentInput } from "demos-server";
import { DocumentDialog, DocumentDialogFields } from "components/dialog/document/DocumentDialog";
import { useToast } from "components/toast/ToastContext";

export const UPLOAD_DOCUMENT_QUERY = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      presignedURL
    }
  }
`;

interface S3UploadResponse {
  success: boolean;
  errorMessage: string;
}

/**
 * @internal - Exported for testing only
 */
export const tryUploadingFileToS3 = async (
  presignedURL: string,
  file: File
): Promise<S3UploadResponse> => {
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

  const defaultDocumentType: DocumentType | undefined = documentTypeSubset?.[0];

  const defaultDocument: DocumentDialogFields = {
    file: null,
    id: "",
    name: "",
    description: "",
    documentType: defaultDocumentType,
  };

  const handleUpload = async (dialogFields: DocumentDialogFields): Promise<void> => {
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

    // If server/.env LOCAL_SIMPLE_UPLOAD="true" we just write to Documents table without S3 upload
    if (uploadResult.presignedURL.includes("http://localhost:4566/")) {
      console.log("Local host document - (basically this isn't an actual doc.");
      onDocumentUploadSucceeded?.();
      return;
    }

    const presignedURL = uploadResult.presignedURL ?? null;

    if (!presignedURL) {
      throw new Error("Could not get presigned URL from the server");
    }

    const response: S3UploadResponse = await tryUploadingFileToS3(presignedURL, dialogFields.file);

    if (!response.success) {
      showError(response.errorMessage);
      throw new Error(response.errorMessage);
    }

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
