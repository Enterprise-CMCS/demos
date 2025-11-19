import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button, ErrorButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon, ExitIcon, FileIcon } from "components/icons";
import { TextInput } from "components/input";
import { DocumentTypeInput } from "components/input/document/DocumentTypeInput";
import { getInputColors, INPUT_BASE_CLASSES, LABEL_CLASSES } from "components/input/Input";
import { useToast } from "components/toast";
import {
  Document,
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "demos-server";
import { useFileDrop } from "hooks/file/useFileDrop";
import { ErrorMessage, UploadStatus, useFileUpload } from "hooks/file/useFileUpload";
import { tw } from "tags/tw";

import { gql, useMutation, PureQueryOptions } from "@apollo/client";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";

export const DELETE_DOCUMENTS_QUERY = gql`
  mutation DeleteDocuments($ids: [ID!]!) {
    deleteDocuments(ids: $ids)
  }
`;

export const UPLOAD_DOCUMENT_QUERY = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      presignedURL
    }
  }
`;

export const UPDATE_DOCUMENT_QUERY = gql`
  mutation UpdateDocument($input: UpdateDocumentInput!) {
    updateDocument(input: $input) {
      id
      title
      description
      documentType
    }
  }
`;

type DocumentDialogType = "add" | "edit";

const STYLES = {
  label: tw`text-text-font font-bold text-field-label flex gap-0-5`,
  textarea: tw`w-full border border-border-fields px-xs py-xs text-sm rounded resize-y`,
  dropzone: tw`border border-dashed border-border-fields bg-surface-secondary rounded px-sm py-sm text-center`,
  dropzoneHeader: tw`text-sm font-bold text-text-font mb-xs`,
  dropzoneOr: tw`text-sm text-text-placeholder mb-sm`,
  fileNote: tw`text-[11px] text-text-placeholder mt-xs leading-tight`,
  fileChip: tw`w-full border border-border-fields rounded flex items-center justify-between px-sm py-2 mt-sm`,
  fileChipLeft: tw`flex items-center gap-2 text-sm font-medium text-text-font truncate`,
  fileMetaRow: tw`flex justify-between mt-1 text-[12px] text-text-placeholder font-medium`,
};

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

const ACCEPTED_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.zip";
const MAX_FILE_SIZE_MB = 600;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILENAME_DISPLAY_LENGTH = 60;

const ERROR_MESSAGES = {
  noFileSelected: "Please select a file to upload.",
  missingField: "A required field is missing.",
};
const SUCCESS_MESSAGES = {
  fileUploaded: "Your document has been added.",
  fileUpdated: "Your document has been updated.",
  fileDeleted: "Your document has been removed.",
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "An unknown error occurred.";

const unknownErrorText = (mode: DocumentDialogType) =>
  mode === "edit"
    ? "Your changes could not be saved because of an unknown problem."
    : "Your document could not be added because of an unknown problem.";

const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

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

const TitleInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => (
  <TextInput
    name="title"
    label="Document Title"
    placeholder="Enter document title"
    onChange={(event) => onChange(event.target.value)}
    value={value}
  />
);

type DescriptionInputProps = { value: string; onChange: (value: string) => void; error?: string };

const DescriptionInput: React.FC<DescriptionInputProps> = ({ value, onChange, error }) => {
  const validationMessage = error ?? "";

  return (
    <div className="flex flex-col gap-sm">
      <label className={LABEL_CLASSES}>Document Description</label>
      <textarea
        rows={2}
        placeholder="Enter"
        className={`${INPUT_BASE_CLASSES} ${getInputColors(validationMessage)} text-sm resize-y`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!validationMessage}
        aria-describedby={validationMessage ? "description-error" : undefined}
      />
      {validationMessage ? (
        <span id="description-error" className="text-error-dark">
          {validationMessage}
        </span>
      ) : null}
    </div>
  );
};

const ProgressBar: React.FC<{ progress: number; uploadStatus: UploadStatus }> = ({
  progress,
  uploadStatus,
}) => {
  const progressBarColor = (
    {
      error: "bg-red-500",
      success: "bg-green-500",
      uploading: "bg-primary",
      idle: "bg-primary",
    } as const
  )[uploadStatus];
  return (
    <div className="bg-border-fields rounded h-[6px] overflow-hidden mt-1">
      <div
        role="progressbar"
        data-testid="upload-progress-bar"
        className={`h-full transition-all ease-in-out duration-500 ${progressBarColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const DropTarget: React.FC<{
  file: File | null;
  onRemove: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ file, onRemove, fileInputRef, uploadStatus, uploadProgress, handleFileChange }) => {
  const handleFiles = useCallback(
    (fileList: FileList) => {
      if (!fileList || fileList.length === 0) return;
      const inputElement = document.createElement("input");
      inputElement.type = "file";
      const dataTransfer = new DataTransfer();
      Array.from(fileList).forEach((fileItem) => dataTransfer.items.add(fileItem));
      inputElement.files = dataTransfer.files;
      // @ts-expect-error React synthetic event compatibility
      handleFileChange({ target: inputElement });
    },
    [handleFileChange]
  );

  const { handleDragOver, handleDrop } = useFileDrop(handleFiles);

  return (
    <div>
      <div className={STYLES.dropzone} onDragOver={handleDragOver} onDrop={handleDrop}>
        <p className={STYLES.dropzoneHeader}>Drop file(s) to upload</p>
        <p className={STYLES.dropzoneOr}>or</p>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          data-testid="input-file"
        />

        <SecondaryButton
          name="select-files"
          type="button"
          aria-label="Select File"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === "uploading"}
        >
          Select File(s)
        </SecondaryButton>

        <p className={STYLES.fileNote}>
          (Note: Files must be less than {MAX_FILE_SIZE_MB}MB)
          <br />
          Allowed file types: {ACCEPTED_EXTENSIONS.split(",").join(", ")}
        </p>
      </div>

      {file && (
        <div className="mt-sm">
          <div className={STYLES.fileChip}>
            <span className={STYLES.fileChipLeft} title={file.name}>
              <FileIcon />
              <span className="truncate">
                {abbreviateLongFilename(file.name, MAX_FILENAME_DISPLAY_LENGTH)}
              </span>
            </span>
            <button
              type="button"
              aria-label="Remove file"
              className="p-1 hover:opacity-80"
              onClick={onRemove}
            >
              <ExitIcon />
            </button>
          </div>
          <ProgressBar progress={uploadProgress} uploadStatus={uploadStatus} />
          {uploadProgress > 0 && (
            <div className={STYLES.fileMetaRow}>
              <span>{(file.size / 1_000_000).toFixed(1)} MB</span>
              <span>{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export type DocumentDialogFields = Pick<Document, "id" | "name" | "description"> & {
  file: File | null;
} & { documentType: DocumentType | undefined };

const EMPTY_DOCUMENT_FIELDS: DocumentDialogFields = {
  file: null,
  id: "",
  name: "",
  description: "",
  documentType: "General File",
};

export type DocumentDialogProps = {
  onClose?: () => void;
  mode: DocumentDialogType;
  documentTypeSubset?: DocumentType[];
  onSubmit?: (dialogFields: DocumentDialogFields) => Promise<void>;
  initialDocument?: DocumentDialogFields;
  titleOverride?: string;
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  onClose = () => {},
  mode,
  documentTypeSubset,
  onSubmit,
  initialDocument,
  titleOverride,
}) => {
  const { showSuccess, showError } = useToast();

  const [activeDocument, setActiveDocument] = useState<DocumentDialogFields>(
    initialDocument || EMPTY_DOCUMENT_FIELDS
  );

  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const dialogTitle = titleOverride ?? (mode === "edit" ? "Edit Document" : "Add New Document");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { file, uploadProgress, uploadStatus, handleFileChange, setFile } = useFileUpload({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    onErrorCallback: (msg: ErrorMessage) => showError(msg),
  });

  useEffect(() => {
    if (initialDocument) {
      setActiveDocument(initialDocument);
    }
  }, [initialDocument]);

  useEffect(() => {
    if (mode === "add" && file && !titleManuallyEdited && !activeDocument.name.trim()) {
      const base = file.name.replace(/\.[^.]+$/, "");
      setActiveDocument((prev) => ({ ...prev, name: base }));
    }
  }, [mode, file, titleManuallyEdited, activeDocument.name]);

  useEffect(() => {
    setActiveDocument((prev) => ({ ...prev, file }));
  }, [file]);

  const isUploading = uploadStatus === "uploading";

  const missingType = !activeDocument.documentType;
  const missingFile = !file;
  const isMissing = missingType || missingFile;

  const focusFirstMissing = () => {
    if (missingType) {
      document.getElementById("document-type")?.focus();
      return;
    }
    if (missingFile) {
      fileInputRef.current?.focus();
      return;
    }
  };

  const onUploadClick = async () => {
    if (isUploading || isSubmitting) return;
    if (isMissing) {
      showError(ERROR_MESSAGES.missingField);
      focusFirstMissing();
      return;
    }
    await handleUpload();
  };

  const handleUpload = async () => {
    try {
      setSubmitting(true);

      if (onSubmit) {
        await onSubmit(activeDocument);
      }

      showSuccess(mode === "edit" ? SUCCESS_MESSAGES.fileUpdated : SUCCESS_MESSAGES.fileUploaded);
      onClose();
    } catch (error: unknown) {
      showError(getErrorMessage(error) || unknownErrorText(mode));
    } finally {
      setSubmitting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <BaseDialog
      title={dialogTitle}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      actions={
        <>
          <SecondaryButton
            name="button-cancel-upload-document"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="button-confirm-upload-document"
            size="small"
            onClick={onUploadClick}
            aria-label="Upload Document"
            aria-disabled={isMissing || isUploading || isSubmitting ? "true" : "false"}
            disabled={isMissing || isUploading || isSubmitting}
          >
            Upload
          </Button>
        </>
      }
    >
      <DropTarget
        file={file}
        onRemove={clearFile}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
      />

      <TitleInput
        value={activeDocument.name}
        onChange={(val) => {
          setActiveDocument((prev) => ({ ...prev, name: val }));
          setTitleManuallyEdited(true);
        }}
      />

      <DescriptionInput
        value={activeDocument.description ?? ""}
        onChange={(val) => setActiveDocument((prev) => ({ ...prev, description: val }))}
      />

      <DocumentTypeInput
        value={activeDocument.documentType}
        onSelect={(val) =>
          setActiveDocument((prev) => ({ ...prev, documentType: val as DocumentType }))
        }
        documentTypeSubset={documentTypeSubset}
      />
    </BaseDialog>
  );
};

type RefetchQueries = Array<string | PureQueryOptions>;

interface AddDocumentDialogProps {
  onClose: () => void;
  applicationId: string;
  documentTypeSubset?: DocumentType[];
  titleOverride?: string;
  refetchQueries?: RefetchQueries;
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

export const EditDocumentDialog: React.FC<{
  onClose: () => void;
  initialDocument: DocumentDialogFields;
}> = ({ onClose, initialDocument }) => {
  const [updateDocumentTrigger] = useMutation<{ updateDocument: Document }>(UPDATE_DOCUMENT_QUERY);

  const handleEdit = async (dialogFields: DocumentDialogFields) => {
    const updateDocumentInput: UpdateDocumentInput = {
      applicationId: dialogFields.id,
      name: dialogFields.name,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    await updateDocumentTrigger({
      variables: { input: updateDocumentInput },
      refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
    });
  };

  return (
    <DocumentDialog
      mode="edit"
      initialDocument={initialDocument}
      onClose={onClose}
      onSubmit={handleEdit}
    />
  );
};

export const RemoveDocumentDialog: React.FC<{
  documentIds: string[];
  onClose: () => void;
}> = ({ documentIds, onClose }) => {
  const { showWarning, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteDocumentsTrigger] = useMutation<{
    removedDocumentIds: string[];
  }>(DELETE_DOCUMENTS_QUERY);

  const onConfirm = async (documentIdList: string[]) => {
    try {
      setIsDeleting(true);
      await deleteDocumentsTrigger({
        variables: { ids: documentIdList },
        refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
      });

      const isMultipleDocuments = documentIdList.length > 1;
      showWarning(
        `Your document${isMultipleDocuments ? "s" : ""} ${
          isMultipleDocuments ? "have been" : "has been"
        } removed.`
      );
      onClose();
    } catch {
      showError("Your changes could not be saved due to an unknown problem.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseDialog
      title={`Remove Document${documentIds.length > 1 ? "s" : ""}`}
      onClose={onClose}
      actions={
        <>
          <SecondaryButton
            name="button-cancel-delete-document"
            size="small"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </SecondaryButton>
          <ErrorButton
            name="button-confirm-delete-document"
            size="small"
            onClick={() => onConfirm(documentIds)}
            aria-label="Confirm Remove Document"
            disabled={isDeleting}
            aria-disabled={isDeleting}
          >
            {isDeleting ? "Removing..." : "Remove"}
          </ErrorButton>
        </>
      }
    >
      <div className="mb-2 text-sm text-text-filled">
        Are you sure you want to remove {documentIds.length} document
        {documentIds.length > 1 ? "s" : ""}?
        <br />
        <span className="text-error flex items-center gap-1 mt-1">
          <ErrorIcon />
          This action cannot be undone.
        </span>
      </div>
    </BaseDialog>
  );
};
