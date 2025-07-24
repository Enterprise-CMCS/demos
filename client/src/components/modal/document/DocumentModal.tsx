import React, { useRef, useState } from "react";
import { useFileUpload } from "hooks/file/useFileUpload";
import { PrimaryButton, SecondaryButton } from "components/button";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { tw } from "tags/tw";

// TODO: get these from the server or a shared constants file.
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

const ERROR_MESSAGES = {
  fileTypeNotAllowed: "File type not allowed.",
  fileTooLarge: "File is too large. Max 600MB.",
  noFileSelected: "Please select a file to upload.",
  descriptionRequired: "Document description is required.",
  fileReadError: "Error reading file.",
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

const abbreviateLongFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

type BaseDocumentModalProps = {
  title: string;
  onClose?: () => void;
  documentId?: string;
};

const DescriptionInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => (
  <div>
    <label className={STYLES.label}>
      <span className="text-text-warn mr-1">*</span>Document Description
    </label>
    <textarea
      rows={2}
      placeholder="Enter"
      className={STYLES.textarea}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        if (error) onChange("");
      }}
    />
  </div>
);

const DocumentTypeInput: React.FC<{
  error?: string;
  onSelect?: (v: string) => void;
}> = ({ error, onSelect }) => (
  <AutoCompleteSelect
    id="document-type"
    label="Document Type"
    options={DOCUMENT_TYPES}
    onSelect={(value) => {
      if (error && onSelect) onSelect("");
      else if (onSelect) onSelect(value);
    }}
  />
);

const ProgressBar: React.FC<{ progress: number; status: string }> = ({
  progress,
  status,
}) => (
  <div className="bg-border-fields rounded h-[6px] overflow-hidden mt-1">
    <div
      role="progressbar"
      className={`h-full transition-all ease-in-out duration-500 ${
        status === "error"
          ? "bg-red-500"
          : status === "success"
            ? "bg-green-500"
            : "bg-primary"
      }`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

const DropTarget: React.FC<{
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadStatus: string;
  uploadProgress: number;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}> = ({
  file,
  fileInputRef,
  uploadStatus,
  uploadProgress,
  handleFileChange,
}) => (
  <div className={STYLES.dropzone}>
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
        <ProgressBar progress={uploadProgress} status={uploadStatus} />
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

const BaseDocumentModal: React.FC<BaseDocumentModalProps> = ({
  onClose = () => {},
  title,
  documentId,
}) => {
  const { showSuccess } = useToast();

  const [description, setDescription] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    file,
    error,
    setError,
    uploadProgress,
    uploadStatus,
    handleFileChange,
  } = useFileUpload({
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    onSuccess: () => {
      showSuccess("File loaded into browser!");
    },
    onError: () => {},
  });

  const handleUpload = () => {
    if (!description) {
      setError(ERROR_MESSAGES.descriptionRequired);
      return;
    }
    if (!file) {
      setError(ERROR_MESSAGES.noFileSelected);
      return;
    }
    showSuccess("File uploaded successfully!");
    onClose();
  };

  return (
    <BaseModal
      title={title}
      onClose={onClose}
      showCancelConfirm={showCancelConfirm}
      setShowCancelConfirm={setShowCancelConfirm}
      actions={
        <>
          <SecondaryButton
            size="small"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton
            size="small"
            onClick={handleUpload}
            disabled={!description || !file || uploadStatus === "uploading"}
            aria-label="Upload Document"
          >
            Upload
          </PrimaryButton>
        </>
      }
    >
      <DescriptionInput
        value={description}
        onChange={setDescription}
        error={error}
      />
      <DocumentTypeInput error={error} />
      <DropTarget
        file={file}
        fileInputRef={fileInputRef}
        uploadStatus={uploadStatus}
        uploadProgress={uploadProgress}
        handleFileChange={handleFileChange}
        error={error}
      />
      {error && <div className="text-[11px] text-red-600 mt-xs">{error}</div>}
    </BaseModal>
  );
};

export const AddDocumentModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => <BaseDocumentModal onClose={onClose} title="Add New Document" />;

interface EditDocumentModalProps {
  documentId: string;
  onClose: () => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  documentId,
  onClose,
}) => (
  <BaseDocumentModal
    documentId={documentId}
    onClose={onClose}
    title="Edit Document"
  />
);
