import { Button } from "components/button";
import { fileTypeFromBlob } from "file-type";
import React from "react";

const FilePreviewer = ({
  blob,
  downloadFileName,
  mimeType,
  presignedDownloadUrl,
}: {
  blob: Blob;
  downloadFileName: string;
  mimeType?: string;
  presignedDownloadUrl: string;
}) => {
  // Sanitized server-side, so the browser has no invalid characters to underscore.
  const file = new File([blob], downloadFileName, { type: mimeType ?? blob.type });
  const blobUrl = URL.createObjectURL(file);

  return mimeType == "application/pdf" ? (
    <embed src={presignedDownloadUrl} className="w-full h-full" />
  ) : (
    <a href={blobUrl} download={downloadFileName} rel="noopener noreferrer">
      <Button size="large" name="button-download-file" aria-label="Download file">
        Download File
      </Button>
    </a>
  );
};

export const DocumentPreview = ({
  presignedDownloadUrl,
  downloadFileName,
}: {
  presignedDownloadUrl: string;
  downloadFileName: string;
}) => {
  const [blob, setBlob] = React.useState<Blob>();
  const [mimeType, setMimeType] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const downloadAndAnalyzeFile = async () => {
      try {
        setLoading(true);
        const response = await fetch(presignedDownloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const fileBlob = await response.blob();
        const detectedType = await fileTypeFromBlob(fileBlob);

        setBlob(fileBlob);
        setMimeType(detectedType?.mime);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to download file");
      } finally {
        setLoading(false);
      }
    };

    downloadAndAnalyzeFile();
  }, [presignedDownloadUrl]);

  if (loading) return <div>Loading file...</div>;
  if (error) return <div>Error loading file: {error}</div>;
  if (!blob) return <div>No file available</div>;

  return (
    <FilePreviewer
      blob={blob}
      downloadFileName={downloadFileName}
      mimeType={mimeType}
      presignedDownloadUrl={presignedDownloadUrl}
    />
  );
};
