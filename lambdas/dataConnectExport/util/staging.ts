import { readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { log } from "../log";

// Owned here so the names a relation is staged under and the patterns cleanupTmp removes
// cannot drift apart.
const PARQUET_SUFFIX = ".parquet";
const CSV_SUFFIX = ".csv";
const STAGED_SUFFIXES = [PARQUET_SUFFIX, CSV_SUFFIX];
const STAGING_PREFIX = "dataconnect-export-";

/** Local path a relation's parquet file is staged to before upload. */
export function stagingPath(relation: string): string {
  return path.join(os.tmpdir(), `${STAGING_PREFIX}${relation}${PARQUET_SUFFIX}`);
}

/** Local path Postgres streams a relation's CSV to, before DuckDB converts it. */
export function csvPath(relation: string): string {
  return path.join(os.tmpdir(), `${STAGING_PREFIX}${relation}${CSV_SUFFIX}`);
}

export async function removeStagedFile(filePath: string): Promise<void> {
  try {
    await rm(filePath, { force: true });
  } catch (error) {
    log.warn(
      { path: filePath, error: (error as Error).message },
      "failed to remove staged export file"
    );
  }
}

/**
 * Remove the files staged during this run.
 *
 * The writer already removes each CSV as soon as it has been converted, so this is a backstop
 * for a run that aborted partway. Lambda reuses /tmp across warm invocations, so anything left
 * behind counts against temporary storage on every later run, and competes with DuckDB if a
 * temp_directory is ever configured there.
 */
export async function cleanupTmp(): Promise<void> {
  const stagingDir = os.tmpdir();

  // Called from a finally block. A failure here must not replace the error that aborted
  // the export, or CloudWatch shows a cleanup problem instead of the real cause.
  try {
    const entries = await readdir(stagingDir);
    const staged = entries.filter(
      (entry) =>
        entry.startsWith(STAGING_PREFIX) &&
        STAGED_SUFFIXES.some((suffix) => entry.endsWith(suffix))
    );

    const results = await Promise.allSettled(
      staged.map((entry) => rm(path.join(stagingDir, entry), { force: true }))
    );
    let removed = 0;

    results.forEach((result, index) => {
      const filePath = path.join(stagingDir, staged[index]);
      if (result.status === "fulfilled") {
        removed += 1;
      } else {
        log.warn(
          {
            path: filePath,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          },
          "failed to clean up staged export files"
        );
      }
    });

    if (removed > 0) {
      log.info({ removed }, "removed staged export files from tmp");
    }
  } catch (error) {
    log.warn({ error: (error as Error).message }, "failed to clean up staged export files");
  }
}
