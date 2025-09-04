import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { Button, ErrorButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon, ExitIcon, FileIcon } from "components/icons";
import { TextInput } from "components/input";
import { useToast } from "components/toast";
import { Document, DocumentType, UpdateDocumentInput, UploadDocumentInput } from "demos-server";
import { useFileDrop } from "hooks/file/useFileDrop";
import { ErrorMessage, UploadStatus, useFileUpload } from "hooks/file/useFileUpload";
import {
  DELETE_DOCUMENTS_QUERY,
  UPDATE_DOCUMENT_QUERY,
  UPLOAD_DOCUMENT_QUERY,
} from "queries/documentQueries";
import { tw } from "tags/tw";
import { useMutation } from "@apollo/client";
import { DocumentTypeInput } from "components/input/document/DocumentTypeInput";

type DocumentDialogType = "add" | "edit";

const STYLES = {
  label: tw`block text-sm font-bold text-text-font mb-xs`,
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
    isRequired
    placeholder="Enter document title"
    onChange={(event) => onChange(event.target.value)}
    value={value}
  />
);

// Forward ref so we can focus() the textarea when a field is missing
type DescriptionInputProps = { value: string; onChange: (value: string) => void; error?: string };
const DescriptionInput = forwardRef<HTMLTextAreaElement, DescriptionInputProps>(
  function DescriptionInput({ value, onChange, error }, ref) {
    return (
      <div>
        <label className={STYLES.label}>
          <span className="text-text-warn mr-1">*</span>Document Description
        </label>
        <textarea
          ref={ref}
          rows={2}
          placeholder="Enter"
          className={STYLES.textarea}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "description-error" : undefined}
        />
      </div>
    );
  }
);

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

export type DocumentDialogFields = Pick<
  Document,
  "id" | "title" | "description" | "documentType"
> & { file: File | null };

const EMPTY_DOCUMENT_FIELDS: DocumentDialogFields = {
  file: null,
  id: "",
  title: "",
  description: "",
  documentType: "General File",
};

export type DocumentDialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  mode: DocumentDialogType;
  documentTypeSubset?: DocumentType[];
  onSubmit?: (dialogFields: DocumentDialogFields) => Promise<void>;
  initialDocument?: DocumentDialogFields;
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen,
  onClose = () => {},
  mode,
  documentTypeSubset,
  onSubmit,
  initialDocument,
}) => {
  const { showSuccess, showError } = useToast();

  const [activeDocument, setActiveDocument] = useState<DocumentDialogFields>(
    initialDocument || EMPTY_DOCUMENT_FIELDS
  );

  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
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
    if (mode === "add" && file && !titleManuallyEdited && !activeDocument.title.trim()) {
      const base = file.name.replace(/\.[^.]+$/, "");
      setActiveDocument((prev) => ({ ...prev, title: base }));
    }
  }, [mode, file, titleManuallyEdited, activeDocument.title]);

  const dialogTitle = mode === "edit" ? "Edit Document" : "Add New Document";
  const isUploading = uploadStatus === "uploading";

  const missingTitle = mode === "edit" ? !activeDocument.title.trim() : false;
  const missingDesc = !activeDocument.description.trim();
  const missingType = !activeDocument.documentType;
  const missingFile = !file;
  const isMissing = missingTitle || missingDesc || missingType || missingFile;

  const focusFirstMissing = () => {
    if (missingDesc) {
      descriptionRef.current?.focus();
      return;
    }
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
      isOpen={isOpen}
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
        value={activeDocument.title}
        onChange={(val) => {
          setActiveDocument((prev) => ({ ...prev, title: val }));
          setTitleManuallyEdited(true);
        }}
      />

      <DescriptionInput
        ref={descriptionRef}
        value={activeDocument.description}
        onChange={(val) => {
          setActiveDocument((prev) => ({ ...prev, description: val }));
        }}
      />

      <DocumentTypeInput
        value={activeDocument.documentType}
        onSelect={(val) => {
          setActiveDocument((prev) => ({ ...prev, documentType: val as DocumentType }));
        }}
        documentTypeSubset={documentTypeSubset}
      />
    </BaseDialog>
  );
};

export const AddDocumentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  documentTypeSubset?: DocumentType[];
}> = ({ isOpen, onClose, documentTypeSubset }) => {
  const { showError, showSuccess } = useToast();
  const [uploadDocumentTrigger] = useMutation(UPLOAD_DOCUMENT_QUERY);
  const handleUpload = async (dialogFields: DocumentDialogFields): Promise<void> => {
    if (!dialogFields.file) {
      showError("No file selected");
      return;
    }

    const uploadDocumentInput: UploadDocumentInput = {
      bundleId: dialogFields.id,
      title: dialogFields.title,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    const uploadDocumentResponse = await uploadDocumentTrigger({
      variables: { input: uploadDocumentInput },
    });
    const presignedURL = uploadDocumentResponse.data?.uploadDocument.presignedUrl ?? null;

    if (!presignedURL) {
      throw new Error("Could not get presigned URL from the server");
    }

    const response: S3UploadResponse = await tryUploadingFileToS3(presignedURL, dialogFields.file);

    if (response.success) {
      showSuccess("Your document was uploaded successfully!");
    } else {
      showError(response.errorMessage);
    }
  };

  return (
    <DocumentDialog
      isOpen={isOpen}
      onClose={onClose}
      mode="add"
      onSubmit={handleUpload}
      documentTypeSubset={documentTypeSubset}
    />
  );
};

export const EditDocumentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialDocument: DocumentDialogFields;
  documentTypeSubset?: DocumentType[];
}> = ({ isOpen, onClose, documentTypeSubset, initialDocument }) => {
  const [updateDocumentTrigger] = useMutation<{ updateDocument: Document }>(UPDATE_DOCUMENT_QUERY);

  const handleEdit = async (dialogFields: DocumentDialogFields) => {
    const updateDocumentInput: UpdateDocumentInput = {
      bundleId: dialogFields.id,
      title: dialogFields.title,
      description: dialogFields.description,
      documentType: dialogFields.documentType,
    };

    await updateDocumentTrigger({ variables: { input: updateDocumentInput } });
  };

  return (
    <DocumentDialog
      isOpen={isOpen}
      mode="edit"
      initialDocument={initialDocument}
      onClose={onClose}
      onSubmit={handleEdit}
      documentTypeSubset={documentTypeSubset}
    />
  );
};

export const RemoveDocumentDialog: React.FC<{
  isOpen: boolean;
  documentIds: string[];
  onClose: () => void;
}> = ({ isOpen, documentIds, onClose }) => {
  const { showWarning, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteDocumentsTrigger] = useMutation<{
    removedDocumentIds: string[];
  }>(DELETE_DOCUMENTS_QUERY);

  const onConfirm = async (documentIdList: string[]) => {
    try {
      setIsDeleting(true);
      await deleteDocumentsTrigger({ variables: { ids: documentIdList } });

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
      isOpen={isOpen}
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
