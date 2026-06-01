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
import { useBNValidationStatus } from "./useBNValidationStatus";
import { useDocumentPassedVirusScan } from "./useDocumentPassedVirusScan";
import { useUploadDocument } from "./useUploadDocument";

const BN_WORKBOOK_DOCUMENT_TYPE: DocumentType = "BN Workbook";

export const UPLOAD_DOCUMENT_TO_DELIVERABLE_STATE_FILES_MUTATION: TypedDocumentNode<
  {
    uploadDocumentToDeliverableStateFiles: Pick<
      DocumentPendingUpload,
      "presignedUploadUrl" | "id"
    >;
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
    uploadDocumentToDeliverableCMSFiles: Pick<
      DocumentPendingUpload,
      "presignedUploadUrl" | "id"
    >;
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

const pickCmsDocumentType = (allowed?: DocumentType[]): DocumentType => {
  if (!allowed || allowed.length === 0) return CMS_FILE_DEFAULT_DOCUMENT_TYPE;
  if (allowed.includes(CMS_FILE_DEFAULT_DOCUMENT_TYPE)) return CMS_FILE_DEFAULT_DOCUMENT_TYPE;
  return allowed[0];
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
  const { documentPassedVirusScan } = useDocumentPassedVirusScan();
  const { waitForBNValidation } = useBNValidationStatus();
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
      documentType: isCmsFile
        ? pickCmsDocumentType(documentTypeSubset)
        : dialogFields.documentType,
    };

    const pendingUpload = isCmsFile
      ? (await uploadCmsDocument(uploadDocumentInput)).uploadDocumentToDeliverableCMSFiles
      : (await uploadStateDocument(uploadDocumentInput)).uploadDocumentToDeliverableStateFiles;

    const response = await tryUploadingFileToS3(pendingUpload.presignedUploadUrl, dialogFields.file);
    if (!response.success) {
      throw new Error(response.errorMessage);
    }

    const isDocumentClean = await documentPassedVirusScan(pendingUpload.id);
    if (!isDocumentClean) {
      return "virus-scan-failed";
    }

    if (uploadDocumentInput.documentType === BN_WORKBOOK_DOCUMENT_TYPE) {
      const validation = await waitForBNValidation(pendingUpload.id);
      if (validation?.status === "Failed") {
        const errorSummary = validation.errors.map((e) => `${e.code}: ${e.message}`).join("\n");
        showError(
          errorSummary
            ? `Budget Neutrality validation failed:\n${errorSummary}`
            : "Budget Neutrality validation failed."
        );
        return "bn-validation-failed";
      }
    }

    if (refetchQueries) {
      await client.refetchQueries({ include: refetchQueries });
    }

    return "succeeded";
  };

  return (
    <DocumentDialog
      onClose={onClose}
      mode="add"
      onSubmit={handleUpload}
      documentTypeSubset={documentTypeSubset}
      titleOverride="Upload Document"
      hideDocumentType={isCmsFile}
      canEditDocumentType={!isCmsFile && (documentTypeSubset?.length ?? 0) !== 1}
    />
  );
};
