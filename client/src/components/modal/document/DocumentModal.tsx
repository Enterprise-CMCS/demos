import React, { useRef, useState } from "react";
import { useFileUpload } from "./useFileUpload";

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

const MAX_FILE_SIZE_MB = 600;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILENAME_DISPLAY_LENGTH = 60;

const abbreviateFilename = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return `${str.slice(0, half)}...${str.slice(-half)}`;
};

type BaseDocumentModalProps = {
  onClose: () => void;
  title: string;
};

const BaseDocumentModal: React.FC<BaseDocumentModalProps> = ({
  onClose,
  title,
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
      setTimeout(() => {
        showSuccess("File loaded into browser!");
      }, 1000);
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
      <div>
        <label className={STYLES.label}>
          <span className="text-text-warn mr-1">*</span>Document Description
        </label>
        <textarea
          rows={2}
          placeholder="Enter"
          className={STYLES.textarea}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError("");
          }}
        />
      </div>

      <div className="w-[240px]">
        <AutoCompleteSelect
          id="document-type"
          label="Document Type"
          options={DOCUMENT_TYPES}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onSelect={(_value: string) => {
            if (error) setError("");
          }}
        />
      </div>

      <div className={STYLES.dropzone}>
        <p className={STYLES.dropzoneHeader}>Drop file(s) to upload</p>
        <p className={STYLES.dropzoneOr}>or</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
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
              {abbreviateFilename(file.name, MAX_FILENAME_DISPLAY_LENGTH)}
            </span>
          ) : (
            "Select File(s)"
          )}
        </SecondaryButton>

        {file && (
          <div className="w-full">
            <div className="bg-border-fields rounded h-[6px] overflow-hidden mt-1">
              <div
                role="progressbar"
                className={`h-full transition-all ease-in-out duration-500 ${
                  uploadStatus === "error"
                    ? "bg-red-500"
                    : uploadStatus === "success"
                      ? "bg-green-500"
                      : "bg-primary"
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

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
          Allowed file types: .pdf, .docx, .doc, .xls, .xlsx, .zip
        </p>
      </div>

      {error && <div className="text-[11px] text-red-600 mt-xs">{error}</div>}
    </BaseModal>
  );
};

export const AddDocumentModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => <BaseDocumentModal onClose={onClose} title="Add New Document" />;

export const EditDocumentModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => <BaseDocumentModal onClose={onClose} title="Edit Document" />;
