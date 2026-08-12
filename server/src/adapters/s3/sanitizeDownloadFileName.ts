import sanitize from "sanitize-filename";

/** Cleans a name into a safe download file name (no extension), falling back to the UUID/key if empty. */
export function sanitizeDownloadFileName(name: string, fallback: string): string {
  const sanitizedName = sanitize(name).trim();
  if (sanitizedName.length > 0) {
    return sanitizedName;
  }

  // Rare: name was entirely invalid characters — fall back to the UUID/key.
  return sanitize(fallback).trim();
}
