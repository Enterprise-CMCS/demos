import React, {
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
    if (selected) {
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
      setFile(selected);
    }
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
            disabled={!description || !file}
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
        <SecondaryButton size="small" onClick={triggerFileSelect}>
          {file ? (
            <span className="max-w-[90%] inline-block text-left truncate">
              {file.name}
            </span>
          ) : (
            "Select File(s)"
          )}
        </SecondaryButton>
        <p className={FILE_NOTE}>
          (Note: Files must be less than 600MB)<br />
          Allowed file types: .pdf, .docx, .doc, .xls, .xlsx, .zip
        </p>
      </div>

      {error && <div className="text-[11px] text-red-600 mt-xs">{error}</div>}
    </BaseModal>
  );
};
