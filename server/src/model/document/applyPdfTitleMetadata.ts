import { getS3Adapter } from "../../adapters";
import { log } from "../../log";
import { setPdfTitle } from "../../services/pdf/setPdfTitle";

const PDF_CONTENT_TYPE = "application/pdf";

/** Writes the document title into the PDF so viewers show it instead of the UUID. Never throws. */
export async function applyPdfTitleMetadata(s3Path: string, title: string): Promise<boolean> {
  const s3Adapter = getS3Adapter();

  try {
    const { bytes, contentType } = await s3Adapter.getCleanBucketObject(s3Path);

    if (contentType !== PDF_CONTENT_TYPE) {
      return false;
    }

    const updatedBytes = await setPdfTitle(bytes, title);
    await s3Adapter.putCleanBucketObject(s3Path, updatedBytes, contentType);
    return true;
  } catch (error) {
    log.error(`Could not apply PDF title metadata to ${s3Path}: ${error}`);
    return false;
  }
}
