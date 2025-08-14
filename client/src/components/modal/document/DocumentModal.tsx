import React, {
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import { useFileDrop } from "hooks/file/useFileDrop";
import {
  ErrorMessage,
  UploadStatus,
  useFileUpload,
} from "hooks/file/useFileUpload";
import { ErrorButton, PrimaryButton, SecondaryButton } from "components/button";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { tw } from "tags/tw";
import { TextInput } from "components/input";
import { ErrorIcon } from "components/icons";


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

export const ERROR_MESSAGES = {
  noFileSelected: "Please select a file to upload.",
  missingField: "A required field is missing.",
};
export const SUCCESS_MESSAGES = {
  fileUploaded: "Your document has been added.",
  fileUpdated: "Your document has been updated.",
  fileDeleted: "Your document has been removed.",
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

// ---------- small helpers ----------
const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

const TitleInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (v: string) => void;
    }>(({ value, onChange }, ref) => (
      <TextInput
        ref={ref}
        name="title"
        label="Document Title"
        isRequired
        placeholder="Enter document title"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      />
    ));
TitleInput.displayName = "TitleInput";

const DescriptionInput = forwardRef<HTMLTextAreaElement, {
  value: string;
  onChange: (v: string) => void;
  error?: string;
    }>(({ value, onChange, error }, ref) => (
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
          aria-invalid={!!error}
          aria-describedby={error ? "doc-desc-error" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && (
          <div id="doc-desc-error" role="alert" className="mt-1 text-[11px] text-red-600">
            {error}
          </div>
        )}
      </div>
    ));
DescriptionInput.displayName = "DescriptionInput";

const DocumentTypeInput: React.FC<{
  value?: string;
  onSelect?: (v: string) => void;
  error?: string;
}> = ({ value, onSelect }) => (
  <AutoCompleteSelect
    id="document-type"
    label="Document Type"
    options={DOCUMENT_TYPES}
    // If your component supports controlled values, pass `value={value}`
    // value={value}
    onSelect={(v) => onSelect?.(v)}
  />
);

// ---------- Progress ----------
const ProgressBar: React.FC<{
  progress: number;
  uploadStatus: UploadStatus;
}> = ({ progress, uploadStatus }) => {
  const progressBarColor =
    {
      error: "bg-red-500",
      success: "bg-green-500",
      uploading: "bg-primary",
      idle: "bg-primary",
    }[uploadStatus] || "bg-primary";

  return (
    <div className="bg-border-fields rounded h-[6px] overflow-hidden mt-1">
      <div
        role="progressbar"
        className={`h-full transition-all ease-in-out duration-500 ${progressBarColor}`}
        style={{ width: `${progress}%` }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

// ---------- DropTarget (forward ref to “Select File” button) ----------
type DropTargetProps = {
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};
const DropTarget = forwardRef<HTMLButtonElement, DropTargetProps>(
  ({ file, fileInputRef, uploadStatus, uploadProgress, handleFileChange }, ref) => {
    const handleFiles = useCallback(
      (files: FileList) => {
        if (!files || files.length === 0) return;
        const input = document.createElement("input");
        input.type = "file";
        const dt = new DataTransfer();
        Array.from(files).forEach((f) => dt.items.add(f));
        input.files = dt.files;
        // @ts-expect-error synthesize event target for our handler
        handleFileChange({ target: input });
      },
      [handleFileChange]
    );
    const { handleDragOver, handleDrop } = useFileDrop(handleFiles);

    return (
      <div
        className={STYLES.dropzone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
          ref={ref}
          type="button"
          aria-label="Select File"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === "uploading"}
          className="w-full max-w-full overflow-hidden text-ellipsis"
        >
          {file ? (
            <span
              className="inline-block max-w-full truncate text-left"
              title={file.name}
            >
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
  }
);
DropTarget.displayName = "DropTarget";

// ---------- Base Modal ----------
type DocumentModalProps = {
  onClose?: () => void;
  forDocumentId?: string | null;
};

type SimpleDocumentType = {
  onClose?: () => void;
  id: string;
  title: string;
  description: string;
  file: File | null;
};

export const DocumentModal: React.FC<SimpleDocumentType> = ({
  onClose = () => {},
  forDocumentId = null,
}) => {

  console.log("YOU ARE IN DocumentModal");

  const { showSuccess, showError } = useToast();

  const documentModalType: DocumentModalType = forDocumentId ? "edit" : "add";

  const modalTitle =
    documentModalType === "edit" ? "Edit Document" : "Add New Document (N/A)";

  const successMessage =
    documentModalType === "edit"
      ? SUCCESS_MESSAGES.fileUpdated
      : SUCCESS_MESSAGES.fileUploaded;

  console.log("Success", successMessage);
  // TODO: get these from GQL hook if needed
  const [documentTitle, setDocumentTitle] = useState("Document title");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState<string>(""); // set requiredness below if needed
  const [error, setError] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // refs to focus invalid fields
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileButtonRef = useRef<HTMLButtonElement>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { file, uploadProgress, uploadStatus, handleFileChange } = useFileUpload({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    onErrorCallback: (errorMessage: ErrorMessage) => {
      setError(errorMessage);
    },
  });

  // If Document Type is required for Add, include `!docType` below.
  const isMissing =
    documentModalType === "edit"
      ? !description.trim() || !file
      : !description.trim() || !file /* || !docType */;

  const isUploading = uploadStatus === "uploading";

  const focusFirstMissing = () => {
    if (!description.trim()) {
      descriptionRef.current?.focus();
      return;
    }
    if (documentModalType === "add" && !docType) {
      document.getElementById("document-type")?.focus();
      return;
    }
    fileButtonRef.current?.focus();
  };

  const onUploadClick = () => {
    if (isUploading) return; // only truly disabled while uploading
    if (isMissing) {
      showError(ERROR_MESSAGES.missingField);
      focusFirstMissing();
      return;
    }
    handleUpload();
  };

  const handleUpload = () => {
    // If you still want granular inline errors, keep these:
    if (!description.trim()) {
      setError(ERROR_MESSAGES.missingField);
      descriptionRef.current?.focus();
      return;
    }
    if (!file) {
      setError(ERROR_MESSAGES.noFileSelected);
      fileButtonRef.current?.focus();
      return;
    }
    // if (documentModalType === "add" && !docType) { /* handle */ }

    showSuccess(successMessage);
    onClose();
  };

  return (
    <BaseModal
      title={modalTitle}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      actions={
        <>
          <SecondaryButton
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancellllxxx
          </SecondaryButton>
          <PrimaryButton
            size="small"
            onClick={onUploadClick}
            aria-disabled={isMissing}   // shows disabled style, but remains clickable
            disabled={isUploading}      // only truly disabled during upload
            aria-label="Upload Document"
            className="[&[aria-disabled='true']]:opacity-50 [&[aria-disabled='true']]:cursor-not-allowed"
          >
            Upload
          </PrimaryButton>
        </>
      }
    >
      {documentModalType === "edit" && (
        <TitleInput
          ref={titleRef}
          value={documentTitle}
          onChange={setDocumentTitle}
        />
      )}

      <DescriptionInput
        ref={descriptionRef}
        value={description}
        onChange={setDescription}
        error={error}
      />

      <DocumentTypeInput value={docType} onSelect={setDocType} />

      <DropTarget
        ref={fileButtonRef}
        file={file}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
        error={error}
      />
      {error && (
        <div className="text-[11px] text-red-600 mt-xs" role="alert">
          {error}
        </div>
      )}
    </BaseModal>
  );
};

// ---------- Exported modals ----------
export const AddDocumentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <DocumentModal onClose={onClose} />
);

export const EditDocumentModal: React.FC<{
  documentId: string;
  onClose: () => void;
}> = ({ documentId, onClose }) => (
  <DocumentModal forDocumentId={documentId} onClose={onClose} />
);

export const RemoveDocumentModal: React.FC<{
  documentIds: string[];
  onClose: () => void;
}> = ({ documentIds, onClose }) => {
  const { showSuccess } = useToast();

  const onConfirm = (ids: string[]) => {
    const multipleDocuments = ids.length > 1;
    // TODO: perform delete...
    showSuccess(
      `Your document${multipleDocuments ? "s" : ""} ${multipleDocuments ? "have been" : "has been"} removed.`
    );
    onClose();
  };

  return (
    <BaseModal
      title={`Remove Document${documentIds.length > 1 ? "s" : ""}`}
      onClose={onClose}
      actions={
        <>
          <SecondaryButton size="small" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <ErrorButton
            size="small"
            onClick={() => onConfirm(documentIds)}
            aria-label="Confirm Remove Document"
          >
            Remove
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
    </BaseModal>
  );
};
