import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, ErrorButton, SecondaryButton } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { ErrorIcon, ExitIcon, FileIcon } from "components/icons";
import { TextInput } from "components/input";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { Option } from "components/input/select/Select";
import { useToast } from "components/toast";
import { Document, DocumentType } from "demos-server";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { useFileDrop } from "hooks/file/useFileDrop";
import { ErrorMessage, UploadStatus, useFileUpload } from "hooks/file/useFileUpload";
import { DELETE_DOCUMENTS_QUERY } from "queries/documentQueries";
import { tw } from "tags/tw";

import { useMutation } from "@apollo/client";

type DocumentDialogType = "add" | "edit";

const DEFAULT_TYPE_OPTIONS: Option[] = DOCUMENT_TYPES.map((type) => ({
  label: type,
  value: type,
}));

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

export const ERROR_MESSAGES = {
  noFileSelected: "Please select a file to upload.",
  missingField: "A required field is missing.",
};
export const SUCCESS_MESSAGES = {
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

const normalizeType = (doctype?: string, options: Option[] = DEFAULT_TYPE_OPTIONS) => {
  if (!doctype) return "";
  if (options.some((o) => o.value === doctype)) return doctype;
  return options.find((o) => o.label === doctype)?.value ?? "";
};

const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const ProgressBar: React.FC<{ progress: number; uploadStatus: UploadStatus }> = ({
  progress,
  uploadStatus,
}) => {
  const color = (
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
        className={`h-full transition-all ease-in-out duration-500 ${color}`}
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

// Inputs
const TitleInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => (
  <TextInput
    name="title"
    label="Document Title"
    isRequired
    placeholder="Enter document title"
    onChange={(e) => onChange(e.target.value)}
    value={value}
  />
);

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
          onChange={(e) => onChange(e.target.value)}
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
  options: Option[];
}> = ({ value, onSelect, options }) => (
  <AutoCompleteSelect
    id="document-type"
    label="Document Type"
    options={options}
    value={value}
    onSelect={(selectedValue) => onSelect?.(selectedValue)}
  />
);

// Props
export type DocumentDialogProps = {
  isOpen?: boolean;
  onClose?: () => void;
  mode: DocumentDialogType;
  forDocumentId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialType?: DocumentType;
  documentTypeOptions?: Option[]; // allow story-specific list & ordering
};

const DocumentDialog: React.FC<DocumentDialogProps> = ({
  isOpen = true,
  onClose = () => {},
  mode,
  initialTitle = "",
  initialDescription = "",
  initialType = "",
  documentTypeOptions,
}) => {
  const { showSuccess, showError } = useToast();
  const options = useMemo(
    () => (documentTypeOptions?.length ? documentTypeOptions : DEFAULT_TYPE_OPTIONS),
    [documentTypeOptions]
  );

  const [documentTitle, setDocumentTitle] = useState(initialTitle);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [selectedType, setSelectedType] = useState(() => normalizeType(initialType, options));
  const [submitting, setSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { file, uploadProgress, uploadStatus, handleFileChange, setFile } = useFileUpload({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    onErrorCallback: (msg: ErrorMessage) => showError(msg),
  });

  // Keep type in sync if prop changes
  useEffect(() => {
    setSelectedType((prev) => normalizeType(prev || initialType, options));
  }, [initialType, options]);

  // Auto-populate title on Add ONLY until the user edits it
  useEffect(() => {
    if (mode === "add" && file && !titleManuallyEdited && !documentTitle.trim()) {
      const base = file.name.replace(/\.[^.]+$/, "");
      setDocumentTitle(base);
    }
  }, [mode, file, titleManuallyEdited, documentTitle]);

  const modalTitle = mode === "edit" ? "Edit Document" : "Add New Document";
  const isUploading = uploadStatus === "uploading";
  const requiresType = true; // required on both add & edit per new UI

  const missingTitle = mode === "edit" ? !documentTitle.trim() : false; // keep original rule
  const missingDesc = !description.trim();
  const missingType = requiresType && !selectedType;
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
    if (isUploading || submitting) return;
    if (isMissing) {
      showError(ERROR_MESSAGES.missingField);
      focusFirstMissing();
      return;
    }
    await handleUpload();
  };

  const handleUpload = async () => {
    // Demo no-op; wire to mutation
    const success = true;
    try {
      setSubmitting(true);
      if (!success) throw new Error(unknownErrorText(mode));
      onClose();
    } catch (error: unknown) {
      showError(getErrorMessage(error) || unknownErrorText(mode));
    } finally {
      if (success) {
        showSuccess(mode === "edit" ? SUCCESS_MESSAGES.fileUpdated : SUCCESS_MESSAGES.fileUploaded);
        onClose();
      }
      setSubmitting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    // keep title if user typed it; do not clear
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
            aria-disabled={isMissing || isUploading || submitting ? "true" : "false"}
            disabled={isMissing || isUploading || submitting}
          >
            Upload
          </Button>
        </>
      }
    >
      {/* Order: Dropzone → File chip/progress → Title → Description → Type */}
      <DropTarget
        file={file}
        onRemove={clearFile}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
      />

      <TitleInput
        value={documentTitle}
        onChange={(val) => {
          setDocumentTitle(val);
          setTitleManuallyEdited(true); // user took control
        }}
      />

      <DescriptionInput ref={descriptionRef} value={description} onChange={setDescription} />

      <DocumentTypeInput value={selectedType} onSelect={setSelectedType} options={options} />
    </BaseDialog>
  );
};

// Export for backward compatibility with tests
export type DocumentDialogFields = Pick<Document, "id" | "title" | "description" | "documentType">;

export const AddDocumentDialog: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  documentTypeOptions?: Option[];
}> = ({ isOpen = true, onClose, documentTypeOptions }) => (
  <DocumentDialog
    isOpen={isOpen}
    onClose={onClose}
    mode="add"
    documentTypeOptions={documentTypeOptions}
  />
);

export const EditDocumentDialog: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  documentTypeOptions?: Option[];
  // Support both patterns for backward compatibility
  initialDocument?: DocumentDialogFields;
  // Individual props (current pattern)
  documentId?: string;
  documentTitle?: string;
  description?: string;
  documentType?: DocumentType;
}> = ({
  isOpen = true,
  onClose,
  documentTypeOptions,
  initialDocument,
  documentId,
  documentTitle,
  description,
  documentType,
}) => {
  // Use initialDocument if provided, otherwise use individual props
  const title = initialDocument?.title ?? documentTitle ?? "";
  const desc = initialDocument?.description ?? description ?? "";
  const type = (initialDocument?.documentType ?? documentType ?? "") as DocumentType | "";
  const id = initialDocument?.id ?? documentId ?? "";

  return (
    <DocumentDialog
      isOpen={isOpen}
      mode="edit"
      forDocumentId={id}
      initialTitle={title}
      initialDescription={desc}
      initialType={type || undefined}
      onClose={onClose}
      documentTypeOptions={documentTypeOptions}
    />
  );
};

export const RemoveDocumentDialog: React.FC<{
  isOpen?: boolean;
  documentIds: string[];
  onClose: () => void;
}> = ({ isOpen = true, documentIds, onClose }) => {
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
