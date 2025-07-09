import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PrimaryButton,
  SecondaryButton,
} from "components/button";
import { AutoCompleteSelect } from "components/input/select/AutoCompleteSelect";
import { BaseModal } from "components/modal/BaseModal";
import { useToast } from "components/toast";
import { tw } from "tags/tw";

const LABEL = tw`block text-sm font-bold text-text-font mb-xs`;
const TEXTAREA = tw`w-full border border-border-fields px-xs py-xs text-sm rounded resize-y`;
const DROPZONE = tw`border border-dashed border-border-fields bg-surface-secondary rounded px-sm py-sm text-center`;
const DROPZONE_HEADER = tw`text-sm font-bold text-text-font mb-xs`;
const DROPZONE_OR = tw`text-sm text-text-placeholder mb-sm`;
const FILE_NOTE = tw`text-[11px] text-text-placeholder mt-xs leading-tight`;

const DOCUMENT_TYPES = [
  { label: "Pre-Submission Concept", value: "preSubmissionConcept" },
  { label: "General File", value: "generalFile" },
];



export const AddDocumentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { showSuccess } = useToast();
  const [description, setDescription] = useState("");
  // TO DO: Save for now until defined in the backend
  // const [provider, setProvider] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  useEffect(() => {
    setUploadProgress(0);
    setUploadStatus("idle");
  }, []);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ];

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) return;

    if (!allowedTypes.includes(selected.type)) {
      setError("File type not allowed.");
      setFile(null);
      return;
    }

    if (selected.size > 600_000_000) {
      setError("File is too large. Max 600MB.");
      setFile(null);
      return;
    }

    setError("");
    e.target.value = ""; // Allow same file to be reselected
    setFile(selected);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onloadend = () => {
      setUploadProgress(100); // ensure it's full
      setUploadStatus("success");

      // Simulate delay so user can see the final progress
      setTimeout(() => {
        showSuccess("File loaded into browser!");
      }, 1000);
    };

    reader.onerror = () => {
      setUploadStatus("error");
      setError("Error reading file.");
    };

    // Start "uploading" (reading into memory)
    reader.readAsArrayBuffer(selected);
  };

  const handleUpload = () => {
    if (!description) {
      setError("Document description is required.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    showSuccess("File uploaded successfully!");
    onClose();
  };

  const truncateMiddle = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    const half = Math.floor((maxLength - 3) / 2);
    return `${str.slice(0, half)}...${str.slice(-half)}`;
  };

  return (
    <BaseModal
      title="Add New Document"
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
        <label className={LABEL}>
          <span className="text-text-warn mr-1">*</span>Document Description
        </label>
        <textarea
          rows={2}
          placeholder="Enter"
          className={TEXTAREA}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError("");
          }}
        />
      </div>

      {/* Narrowed down to match old layout */}
      <div className="w-[240px]">
        <AutoCompleteSelect
          id="document-type"
          label="Document Type"
          options={DOCUMENT_TYPES}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onSelect={(_value: string) => {
            // TO DO: Save for now until defined in the backend
            // setProvider(value);
            if (error) setError("");
          }}
        />
      </div>

      <div className={DROPZONE}>
        <p className={DROPZONE_HEADER}>Drop file(s) to upload</p>
        <p className={DROPZONE_OR}>or</p>
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
          onClick={triggerFileSelect}
          disabled={uploadStatus === "uploading"}
          className="w-full max-w-full overflow-hidden text-ellipsis"
        >
          {file ? (
            <span
              className="inline-block max-w-full truncate text-left"
              title={file.name}
            >
              {truncateMiddle(file.name, 60)}
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
                className={`h-full transition-all ease-in-out duration-500 ${uploadStatus === "error"
                  ? "bg-red-500"
                  : uploadStatus === "success"
                    ? "bg-green-500"
                    : "bg-primary"
                  // eslint-disable-next-line indent
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


        <p className={FILE_NOTE}>
          (Note: Files must be less than 600MB)<br />
          Allowed file types: .pdf, .docx, .doc, .xls, .xlsx, .zip
        </p>
      </div>

      {error && <div className="text-[11px] text-red-600 mt-xs">{error}</div>}
    </BaseModal>
  );
};
