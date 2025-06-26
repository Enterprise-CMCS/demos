import React, {
  useRef,
  useState,
} from "react";

import {
  PrimaryButton,
  SecondaryButton,
} from "components/button";
import { ErrorOutlinedButton } from "components/button/ErrorOutlinedButton";
import { useToast } from "components/toast";
import { tw } from "tags/tw";

interface Props {
  onClose: () => void;
}

const MODAL_OVERLAY = tw`fixed inset-0 z-[999] flex items-center justify-center bg-black/40`;
const MODAL_CONTAINER = tw`bg-surface-white text-text-font w-full max-w-[520px] rounded shadow-md p-sm relative max-h-[85vh] overflow-y-auto`;

const CLOSE_BUTTON = tw`absolute top-xs right-sm text-[22px] text-text-placeholder hover:text-text-font`;

const TITLE = tw`text-[18px] font-bold mb-xs`;
const HR = tw`border-border-rules mb-sm mt-sm`;

const LABEL = tw`block text-sm font-medium text-text-font mb-xs`;
const REQUIRED = tw`text-text-warn mr-1`;
const INPUT = tw`w-full border border-border-fields px-xs py-xs text-sm rounded`;
const TEXTAREA = tw`w-full border border-border-fields px-xs py-xs text-sm rounded resize-y`;

const SELECT_WRAPPER = tw`w-full md:w-1/2 mb-sm`;

const DROPZONE = tw`border border-dashed border-border-fields bg-surface-secondary rounded px-sm py-sm text-center`;
const DROPZONE_HEADER = tw`text-sm font-bold text-text-font mb-xs`;
const DROPZONE_OR = tw`text-sm text-text-placeholder mb-sm`;
const FILE_NOTE = tw`text-[11px] text-text-placeholder mt-xs leading-tight`;

const BUTTON_ROW = tw`flex justify-end gap-sm`;

const AddDocumentModal: React.FC<Props> = ({ onClose }) => {
  const { showSuccess } = useToast();

  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.ms-excel",
    "application / vnd.ms - excel.sheet.macroEnabled.12",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
  ];

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = () => {
    if (!description) {
      setError("Document description is required.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (error) return;

    showSuccess("File uploaded successfully!");
    onClose();
  };

  const isFileValid = file && file.size < 600_000_000;

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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

  return (
    <>
      <div className={MODAL_OVERLAY}>
        <div className={MODAL_CONTAINER}>
          <button
            onClick={() => setShowCancelConfirm(true)}
            className={CLOSE_BUTTON}
            aria-label="Close modal"
          >
            ×
          </button>

          <h2 className={TITLE}>Add New Document</h2>
          <hr className={HR} />

          {/* Description */}
          <div className="mb-xs">
            <label className={LABEL}>
              <span className={REQUIRED}>*</span>Document Description
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

          {/* Provided By */}
          <div className={SELECT_WRAPPER}>
            <label className={LABEL}>Document Type</label>
            <select
              className={INPUT}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                if (error) setError("");
              }}
            >
              <option value="">Select</option>
              <option value="preSubmissionConcept">Pre-Submission Concept</option>
              <option value="generalFile">General File</option>
            </select>
          </div>

          {/* File Upload */}
          <div className={DROPZONE}>
            <p className={DROPZONE_HEADER}>Drop file(s) to upload</p>
            <p className={DROPZONE_OR}>or</p>

            <input
              data-testid="file-input"
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={handleFileChange}
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

          {/* Error + Action Buttons */}
          {error && <div className="text-[11px] text-red-600 mt-xs">{error}</div>}
          <hr className={HR} />
          <div className={BUTTON_ROW}>
            <SecondaryButton size="small" onClick={() => setShowCancelConfirm(true)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              size="small"
              onClick={handleUpload}
              disabled={!description || !isFileValid}
            >
              Upload
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Prompt */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
          <div className="bg-surface-white border border-border-rules rounded p-2 w-[400px] shadow-md text-center">
            <p className="text-sm font-bold mb-sm text-text-font">
              Are you sure you want to cancel?
            </p>
            <div className="flex justify-center gap-sm">
              <SecondaryButton size="small" onClick={() => setShowCancelConfirm(false)}>
                No
              </SecondaryButton>
              <ErrorOutlinedButton size="small" onClick={onClose}>
                Yes
              </ErrorOutlinedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { AddDocumentModal };
