import { useState } from "react";

const ERROR_MESSAGES = {
  FILE_TYPE_NOT_ALLOWED: "File type not allowed.",
  FILE_TOO_LARGE: "File is too large.",
  FILE_READ_ERROR: "Error reading file.",
};

type UploadStatus = "idle" | "uploading" | "success" | "error";
type ErrorMessage = string;

export const useFileUpload = ({
  allowedMimeTypes,
  maxFileSizeBytes,
  onSuccessCallback,
  onErrorCallback,
}: {
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  onSuccessCallback?: (file: File) => void;
  onErrorCallback?: (errorMessage: ErrorMessage) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) return;

    if (!allowedMimeTypes.includes(selected.type)) {
      setFile(null);
      onErrorCallback?.(ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED);
      return;
    }

    if (selected.size > maxFileSizeBytes) {
      setFile(null);
      onErrorCallback?.(ERROR_MESSAGES.FILE_TOO_LARGE);
      return;
    }

    e.target.value = ""; // Allow same file to be reselected
    setFile(selected);
    setUploadStatus("uploading");
    setUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onloadend = () => {
      setUploadProgress(100);
      setUploadStatus("success");
      onSuccessCallback?.(selected);
    };

    reader.onerror = () => {
      setUploadStatus("error");
      onErrorCallback?.(ERROR_MESSAGES.FILE_READ_ERROR);
    };

    reader.readAsArrayBuffer(selected);
  };

  return {
    file,
    setFile,
    uploadProgress,
    uploadStatus,
    setUploadProgress,
    setUploadStatus,
    handleFileChange,
  };
};
