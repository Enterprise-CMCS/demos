import { Button } from "components/button";
import { fileTypeFromBlob } from "file-type";
import React from "react";

const FilePreviewer = ({
  blob,
  filename,
  mimeType,
  presignedDownloadUrl,
}: {
  blob: Blob;
  filename: string;
  mimeType?: string;
  presignedDownloadUrl: string;
}) => {
  // The document title is the download name, verbatim, to stay consistent with
  // what's stored and displayed everywhere else (no extension appended).
  const file = new File([blob], filename, { type: mimeType ?? blob.type });
  const blobUrl = URL.createObjectURL(file);

  // For PDFs, embed the presigned URL directly so the browser's native viewer
  // shows the document title from its Content-Disposition header. Embedding the
  // blob URL instead would label the toolbar with a random object-URL UUID.
  return mimeType == "application/pdf" ? (
    <embed src={presignedDownloadUrl} className="w-full h-full" />
  ) : (
    <a href={blobUrl} download={filename} rel="noopener noreferrer">
      <Button size="large" name="button-download-file" ariaLabel="Download file">
        Download File
      </Button>
    </a>
  );
};

export const DocumentPreview = ({
  presignedDownloadUrl,
  filename,
}: {
  presignedDownloadUrl: string;
  filename: string;
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
      filename={filename}
      mimeType={mimeType}
      presignedDownloadUrl={presignedDownloadUrl}
    />
  );
};
