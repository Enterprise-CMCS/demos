import React, { useRef, useEffect, useState, useCallback, forwardRef } from "react";
import { useFileDrop } from "hooks/file/useFileDrop";
import { ErrorMessage, UploadStatus, useFileUpload } from "hooks/file/useFileUpload";
import { ErrorButton, PrimaryButton, SecondaryButton } from "components/button";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { tw } from "tags/tw";
import { TextInput } from "components/input";

type DocumentModalType = "add" | "edit" | "remove";

const DOCUMENT_TYPES = [
  { label: "Pre-Submission Concept", value: "preSubmissionConcept" },
  { label: "General File", value: "generalFile" },
];

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
const unknownErrorText = (m: DocumentModalType) =>
  m === "edit"
    ? "Your changes could not be saved because of an unknown problem."
    : "Your document could not be added because of an unknown problem.";

const normalizeType = (t?: string) => {
  if (!t) return "";
  if (DOCUMENT_TYPES.some((o) => o.value === t)) return t;
  return DOCUMENT_TYPES.find((o) => o.label === t)?.value ?? "";
};

const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const TitleInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <TextInput
    name="title"
    label="Document Title"
    isRequired
    placeholder="Enter document title"
    onChange={(e) => onChange(e.target.value)}
    value={value}
  />
);

// Forward ref so we can focus() the textarea when a field is missing
type DescriptionInputProps = { value: string; onChange: (v: string) => void; error?: string };
const DescriptionInput = forwardRef<HTMLTextAreaElement, DescriptionInputProps>(({ value, onChange, error }, ref) => (
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
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error ? "description-error" : undefined}
    />
  </div>
));
DescriptionInput.displayName = "DescriptionInput";

const DocumentTypeInput: React.FC<{
  value?: string;
  onSelect?: (v: string) => void;
}> = ({ value, onSelect }) => {
  return (
    <AutoCompleteSelect
      id="document-type"
      label="Document Type"
      options={DOCUMENT_TYPES}
      value={value}
      onSelect={(val) => onSelect?.(val)}
    />
  );
};

const ProgressBar: React.FC<{ progress: number; uploadStatus: UploadStatus }> = ({ progress, uploadStatus }) => {
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
      <div role="progressbar" className={`h-full transition-all ease-in-out duration-500 ${progressBarColor}`} style={{ width: `${progress}%` }} />
    </div>
  );
};

const DropTarget: React.FC<{
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ file, fileInputRef, uploadStatus, uploadProgress, handleFileChange }) => {
  const handleFiles = useCallback(
    (files: FileList) => {
      if (!files || files.length === 0) return;
      const input = document.createElement("input");
      input.type = "file";
      const dt = new DataTransfer();
      Array.from(files).forEach((f) => dt.items.add(f));
      input.files = dt.files;
      // @ts-expect-error: shape it like a synthetic event for our handler
      handleFileChange({ target: input });
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
        type="button"
        aria-label="Select File"
        size="small"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadStatus === "uploading"}
        className="w-full max-w-full overflow-hidden text-ellipsis"
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

export type DocumentModalProps = {
  onClose?: () => void;
  mode: "add" | "edit" | "remove";
  forDocumentId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialType?: string;
};

export const DocumentModal: React.FC<DocumentModalProps> = ({
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

  const documentModalType: DocumentModalType = mode;
  const modalTitle = documentModalType === "edit" ? "Edit Document" : "Add New Document";
  const isUploading = uploadStatus === "uploading";
  const requiresType = documentModalType === "add" || documentModalType === "edit";

  const isMissing =
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
    const success = false;
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
      const msg = error instanceof Error ? getErrorMessage(error) : unknownErrorText(documentModalType);
      showError(msg);
    } finally {
      onClose();
      if (success) {
        showSuccess(
          documentModalType === "edit"
            ? SUCCESS_MESSAGES.fileUpdated
            : SUCCESS_MESSAGES.fileUploaded
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      title={modalTitle}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      actions={
        <>
          <SecondaryButton size="small" onClick={() => setShowCancelConfirm(true)}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="small"
            onClick={onUploadClick}
            aria-label="Upload Document"
            aria-disabled={isMissing || submitting}
            disabled={isUploading || submitting}
            className="[&[aria-disabled='true']]:opacity-50 [&[aria-disabled='true']]:cursor-not-allowed"
          >
            Upload
          </PrimaryButton>
        </>
      }
    >
      {documentModalType === "edit" && <TitleInput value={documentTitle} onChange={setDocumentTitle} />}

      <DescriptionInput
        ref={descriptionRef}
        value={description}
        onChange={setDescription}
      />

      <DocumentTypeInput value={selectedType} onSelect={setSelectedType} />

      <DropTarget
        file={file}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
      />
    </BaseModal>
  );
};

export const AddDocumentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <DocumentModal onClose={onClose} mode="add" />
);

export const EditDocumentModal: React.FC<{
  documentId: string;
  documentTitle: string;
  description: string;
  documentType: string;
  onClose: () => void;
}> = ({ documentId, documentTitle, description, documentType, onClose }) => (
  <DocumentModal
    mode="edit"
    forDocumentId={documentId}
    initialTitle={documentTitle}
    initialDescription={description}
    initialType={documentType}
    onClose={onClose}
  />
);

export const RemoveDocumentModal: React.FC<{ documentIds: string[]; onClose: () => void }> = ({ documentIds, onClose }) => {
  const { showWarning, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const onConfirm = async (ids: string[]) => {
    try {
      setSubmitting(true);
      // TODO: await api.deleteDocuments(ids);
      const multiple = ids.length > 1;
      showWarning(
        `Your document${multiple ? "s" : ""} ${multiple ? "have been" : "has been"} removed.`
      );
      onClose();
    } catch (e) {
      showError("Your changes could not be saved due to an unknown problem.");
      console.error("Remove documents failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      title={`Remove Document${documentIds.length > 1 ? "s" : ""}`}
      onClose={onClose}
      actions={
        <>
          <SecondaryButton size="small" onClick={onClose} disabled={submitting}>
            Cancel
          </SecondaryButton>
          <ErrorButton
            size="small"
            onClick={() => onConfirm(documentIds)}
            aria-label="Confirm Remove Document"
            disabled={submitting}
          >
            {submitting ? "Removing..." : "Remove"}
          </ErrorButton>
        </>
      }
    >
      <div>
        Are you sure you want to remove {documentIds.length > 1 ? "these documents" : "this document"}?
      </div>
    </BaseModal>
  );
};
