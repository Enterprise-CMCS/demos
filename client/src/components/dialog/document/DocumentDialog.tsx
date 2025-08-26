import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";

import { Button, ErrorButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon } from "components/icons";
import { TextInput } from "components/input";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { useToast } from "components/toast";
import { useFileDrop } from "hooks/file/useFileDrop";
import { ErrorMessage, UploadStatus, useFileUpload } from "hooks/file/useFileUpload";
import { DELETE_DOCUMENTS_QUERY, UPLOAD_DOCUMENT_QUERY, UPDATE_DOCUMENT_QUERY } from "queries/documentQueries";
import { tw } from "tags/tw";
import { Document, DocumentType, UploadDocumentInput, UpdateDocumentInput } from "demos-server";

type DocumentDialogType = "add" | "edit";

const DOCUMENT_TYPE_LOOKUP: Record<DocumentType, string> = {
  preSubmissionConcept: "Pre-Submission Concept",
  generalFile: "General File",
};

const DOCUMENT_TYPE_OPTIONS: Option[] = Object.entries(DOCUMENT_TYPE_LOOKUP).map(
  ([value, label]) => ({ value, label })
);

const STYLES = {
  label: tw`block text-sm font-bold text-text-font mb-xs`,
  textarea: tw`w-full border border-border-fields px-xs py-xs text-sm rounded resize-y`,
  dropzone: tw`border border-dashed border-border-fields bg-surface-secondary rounded px-sm py-sm text-center`,
  dropzoneHeader: tw`text-sm font-bold text-text-font mb-xs`,
  dropzoneOr: tw`text-sm text-text-placeholder mb-sm`,
  fileNote: tw`text-[11px] text-text-placeholder mt-xs leading-tight`,
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

export const ERROR_MESSAGES = {
  noFileSelected: "Please select a file to upload.",
  missingField: "A required field is missing.",
};
export const SUCCESS_MESSAGES = {
  fileUploaded: "Your document has been added.",
  fileUpdated: "Your document has been updated.",
  fileDeleted: "Your document has been removed.",
};

// Simple error message retreiver.
// Maybe we "third location" this as we standardize error messages
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred.";
};

// helper to choose the unknown-error copy by mode
const unknownErrorText = (mode: DocumentDialogType) =>
  mode === "edit"
    ? "Your changes could not be saved because of an unknown problem."
    : "Your document could not be added because of an unknown problem.";

const normalizeType = (doctype?: string) => {
  if (!doctype) return "";
  if (DOCUMENT_TYPE_OPTIONS.some((o) => o.value === doctype)) return doctype;
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.label === doctype)?.value ?? "";
};

const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
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
          data-testid="textarea-description-input"
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

const DocumentTypeInput: React.FC<{
  value?: string;
  onSelect?: (value: string) => void;
}> = ({ value, onSelect }) => {
  return (
    <AutoCompleteSelect
      id="document-type"
      label="Document Type"
      options={DOCUMENT_TYPE_OPTIONS}
      value={value}
      onSelect={(selectedValue) => onSelect?.(selectedValue)}
    />
  );
};

const ProgressBar: React.FC<{ progress: number; uploadStatus: UploadStatus }> = ({
  progress,
  uploadStatus,
}) => {
  const progressBarColor =
    (
      {
        error: "bg-red-500",
        success: "bg-green-500",
        uploading: "bg-primary",
        idle: "bg-primary",
      } as const
    )[uploadStatus] || "bg-primary";

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
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ file, fileInputRef, uploadStatus, uploadProgress, handleFileChange }) => {
  const handleFiles = useCallback(
    (fileList: FileList) => {
      if (!fileList || fileList.length === 0) return;
      const inputElement = document.createElement("input");
      inputElement.type = "file";
      const dataTransfer = new DataTransfer();
      Array.from(fileList).forEach((fileItem) => dataTransfer.items.add(fileItem));
      inputElement.files = dataTransfer.files;
      // @ts-expect-error: for React synthetic event compatibility
      handleFileChange({ target: inputElement });
    },
    [handleFileChange]
  );

  const { handleDragOver, handleDrop } = useFileDrop(handleFiles);

  return (
    <div className={STYLES.dropzone} onDragOver={handleDragOver} onDrop={handleDrop}>
      <p className={STYLES.dropzoneHeader}>Drop file(s) to upload</p>
      <p className={STYLES.dropzoneOr}>or</p>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileChange}
        data-testid="file-input"
      />

      <SecondaryButton
        name="select-files"
        type="button"
        aria-label="Select File"
        size="small"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadStatus === "uploading"}
      >
        {file ? (
          <span className="inline-block max-w-full truncate text-left" title={file.name}>
            {abbreviateLongFilename(file.name, MAX_FILENAME_DISPLAY_LENGTH)}
          </span>
        ) : (
          "Select File(s)"
        )}
      </SecondaryButton>

      {file && (
        <div className="w-full">
          <ProgressBar progress={uploadProgress} uploadStatus={uploadStatus} />
          {uploadProgress > 0 && (
            <div className="flex justify-between mt-1 text-[12px] text-text-placeholder font-medium">
              <span>{(file.size / 1_000_000).toFixed(1)} MB</span>
              <span>{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      <p className={STYLES.fileNote}>
        (Note: Files must be less than {MAX_FILE_SIZE_MB}MB)
        <br />
        Allowed file types: {ACCEPTED_EXTENSIONS.split(",").join(", ")}
      </p>
    </div>
  );
};

type DocumentDialogProps = {
  isOpen?: boolean;
  onClose?: () => void;
  mode: "add" | "edit";
  forDocumentId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialType?: string;
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen = true,
  onClose = () => {},
  mode,
  initialTitle = "",
  initialDescription = "",
  initialType = "",
}) => {
  const { showSuccess, showError } = useToast();
  const [documentTitle, setDocumentTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [selectedType, setSelectedType] = useState(() => normalizeType(initialType));
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { file, uploadProgress, uploadStatus, handleFileChange } = useFileUpload({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    onErrorCallback: (errorMessage: ErrorMessage) => showError(errorMessage),
  });

  // keep type in sync if prop changes
  useEffect(() => {
    setSelectedType(normalizeType(initialType));
  }, [initialType]);

  const modalTitle = mode === "edit" ? "Edit Document" : "Add New Document";
  const isUploading = uploadStatus === "uploading";

  const requiresType = mode === "add" || mode === "edit";

  // Edit has a title, but create does not. (maybe HCD convo)
  const isMissing =
    (mode === "edit" && !documentTitle.trim()) ||
    !description.trim() ||
    !file ||
    (requiresType && !selectedType);

  const onUploadClick = async () => {
    if (isUploading || submitting) return;
    await handleUpload();
  };

  const focusFirstMissing = () => {
    if (!description.trim()) {
      descriptionRef.current?.focus();
      return;
    }
    if (requiresType && !selectedType) {
      document.getElementById("document-type")?.focus();
      return;
    }
    fileInputRef.current?.focus();
  };

  const handleUpload = async () => {
    if (!description.trim() || (requiresType && !selectedType)) {
      showError(ERROR_MESSAGES.missingField);
      focusFirstMissing();
      return;
    }
    if (!file) {
      showError(ERROR_MESSAGES.noFileSelected);
      focusFirstMissing();
      return;
    }
    // This is just for testing purposes. Fill it in as needed
    const success = true;
    try {
      setSubmitting(true);
      // your api/mutator call goes here
      if (!success) {
        // Throw error to see message.
        // Still need to break down specifc file size vs fail virus check messages
        throw new Error("Your document could not be added because of an unknown problem.");
      }
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? getErrorMessage(error) : unknownErrorText(mode);
      showError(msg);
    } finally {
      onClose();
      if (success) {
        showSuccess(mode === "edit" ? SUCCESS_MESSAGES.fileUpdated : SUCCESS_MESSAGES.fileUploaded);
      }
      setSubmitting(false);
    }
  };

  return (
    <BaseDialog
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      actions={
        <>
          <SecondaryButton
            name="cancel-upload"
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <Button
            name="upload-document"
            size="small"
            onClick={onUploadClick}
            aria-label="Upload Document"
            aria-disabled={isMissing || isUploading || submitting ? "true" : "false"}
            disabled={isMissing || isUploading || submitting}
          >
            Upload
          </Button>
        </>
      }
    >
      {mode === "edit" && <TitleInput value={documentTitle} onChange={setDocumentTitle} />}

      <DescriptionInput ref={descriptionRef} value={description} onChange={setDescription} />

      <DocumentTypeInput value={selectedType} onSelect={setSelectedType} />

      <DropTarget
        file={file}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
      />
    </BaseDialog>
  );
};

export const AddDocumentDialog: React.FC<{ isOpen?: boolean; onClose: () => void }> = ({
  isOpen = true,
  onClose,
}) => <DocumentDialog isOpen={isOpen} onClose={onClose} mode="add" />;

export const EditDocumentDialog: React.FC<{
  isOpen?: boolean;
  documentId: string;
  documentTitle: string;
  description: string;
  documentType: string;
  onClose: () => void;
}> = ({ isOpen = true, documentId, documentTitle, description, documentType, onClose }) => (
  <DocumentDialog
    isOpen={isOpen}
    mode="edit"
    forDocumentId={documentId}
    initialTitle={documentTitle}
    initialDescription={description}
    initialType={documentType}
    onClose={onClose}
  />
);

export const RemoveDocumentDialog: React.FC<{
  isOpen?: boolean;
  documentIds: string[];
  onClose: () => void;
}> = ({ isOpen = true, documentIds, onClose }) => {
  const { showWarning, showError } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteDocumentsTrigger] = useMutation<{ removedDocumentIds: string[] }>(
    DELETE_DOCUMENTS_QUERY
  );

  const onConfirm = async (documentIdList: string[]) => {
    try {
      setIsDeleting(true);
      await deleteDocumentsTrigger({ variables: { ids: documentIdList } });

      const isMultipleDocuments = documentIdList.length > 1;
      showWarning(
        `Your document${isMultipleDocuments ? "s" : ""} ${isMultipleDocuments ? "have been" : "has been"} removed.`
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
            name="cancel-remove"
            size="small"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </SecondaryButton>
          <ErrorButton
            name="confirm-remove"
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
