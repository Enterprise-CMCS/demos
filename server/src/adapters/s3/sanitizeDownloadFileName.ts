import sanitize from "sanitize-filename";

// A space, not "", so separated tokens stay readable: "FY25/26" -> "FY25 26".
const INVALID_CHARACTER_REPLACEMENT = " ";

/** Cleans a name into a safe download file name (no extension), falling back to the UUID/key if empty. */
export function sanitizeDownloadFileName(name: string, fallback: string): string {
  const sanitizedName = cleanFileName(name);
  if (sanitizedName.length > 0) {
    return sanitizedName;
  }

  // Rare: name was entirely invalid characters — fall back to the UUID/key.
  return cleanFileName(fallback);
}

/** Strips characters that are invalid in file names and collapses the resulting whitespace. */
function cleanFileName(name: string): string {
  return sanitize(name, { replacement: INVALID_CHARACTER_REPLACEMENT })
    .replace(/\s+/g, " ")
    .trim();
}
