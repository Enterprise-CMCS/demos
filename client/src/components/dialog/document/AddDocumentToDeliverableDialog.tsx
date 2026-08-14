import React from "react";
import { gql, useApolloClient, TypedDocumentNode } from "@apollo/client";

import {
  DocumentPendingUpload,
  DocumentType,
  UploadDocumentToDeliverableInput,
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

export const UPLOAD_DOCUMENT_TO_DELIVERABLE_STATE_FILES_MUTATION: TypedDocumentNode<
  {
    uploadDocumentToDeliverableStateFiles: Pick<DocumentPendingUpload, "presignedUploadUrl" | "id">;
  },
  { input: UploadDocumentToDeliverableInput }
> = gql`
  mutation UploadDocumentToDeliverableStateFiles($input: UploadDocumentToDeliverableInput!) {
    uploadDocumentToDeliverableStateFiles(input: $input) {
      id
      presignedUploadUrl
    }
  }
`;

export const UPLOAD_DOCUMENT_TO_DELIVERABLE_CMS_FILES_MUTATION: TypedDocumentNode<
  {
    uploadDocumentToDeliverableCMSFiles: Pick<DocumentPendingUpload, "presignedUploadUrl" | "id">;
  },
  { input: UploadDocumentToDeliverableInput }
> = gql`
  mutation UploadDocumentToDeliverableCMSFiles($input: UploadDocumentToDeliverableInput!) {
    uploadDocumentToDeliverableCMSFiles(input: $input) {
      id
      presignedUploadUrl
    }
  }
`;

const CMS_FILE_DEFAULT_DOCUMENT_TYPE: DocumentType = "General File";

const CMS_FILE_DOCUMENT_TYPES: DocumentType[] = [CMS_FILE_DEFAULT_DOCUMENT_TYPE, "BN Template"];

const getCmsFileDocumentTypeSubset = (allowed: DocumentType[] = []): DocumentType[] => {
  const subset = CMS_FILE_DOCUMENT_TYPES.filter((type) => allowed.includes(type));
  return subset.length > 0 ? subset : [CMS_FILE_DEFAULT_DOCUMENT_TYPE];
};

interface AddDocumentToDeliverableDialogProps {
  onClose: () => void;
  deliverableId: string;
  applicationId: string;
  isCmsFile: boolean;
  documentTypeSubset?: DocumentType[];
  refetchQueries?: string[];
}

export const AddDocumentToDeliverableDialog: React.FC<AddDocumentToDeliverableDialogProps> = ({
  onClose,
  deliverableId,
  applicationId,
  isCmsFile,
  documentTypeSubset,
  refetchQueries,
}) => {
  const { showError } = useToast();
  const client = useApolloClient();
  const effectiveDocumentTypeSubset = isCmsFile
    ? getCmsFileDocumentTypeSubset(documentTypeSubset)
    : documentTypeSubset;
  const { documentPassedVirusScan } = useDocumentPassedVirusScan();
  const { uploadDocument: uploadStateDocument } = useUploadDocument(
    UPLOAD_DOCUMENT_TO_DELIVERABLE_STATE_FILES_MUTATION
  );
  const { uploadDocument: uploadCmsDocument } = useUploadDocument(
    UPLOAD_DOCUMENT_TO_DELIVERABLE_CMS_FILES_MUTATION
  );

  const handleUpload = async (
    dialogFields: DocumentDialogFields
  ): Promise<DocumentUploadResult> => {
    if (!dialogFields.file) {
      showError("Please select a file to upload.");
      return "unknown-error";
    }

    const uploadDocumentInput: UploadDocumentToDeliverableInput = {
      applicationId,
      deliverableId,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    const pendingUpload = isCmsFile
      ? (await uploadCmsDocument(uploadDocumentInput)).uploadDocumentToDeliverableCMSFiles
      : (await uploadStateDocument(uploadDocumentInput)).uploadDocumentToDeliverableStateFiles;

    const response = await tryUploadingFileToS3(
      pendingUpload.presignedUploadUrl,
      dialogFields.file
    );
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    const isDocumentClean = await documentPassedVirusScan(pendingUpload.id);
    if (!isDocumentClean) {
      return "virus-scan-failed";
    }

    // BN validation finishes server-side on its own schedule; useBNWorkbookPreValidation already
    // ran the same ruleset before upload, so the dialog doesn't wait on it.
    if (refetchQueries) {
      await client.refetchQueries({ include: refetchQueries });
    }

    return "succeeded";
  };

  return (
    <DocumentDialog
      onClose={onClose}
      onSubmit={handleUpload}
      applicableDocumentTypes={effectiveDocumentTypeSubset}
      titleOverride="Upload Document"
    />
  );
};
