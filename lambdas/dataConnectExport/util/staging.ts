import { readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { log } from "../log";

// Owned here so the name a relation is staged under and the pattern cleanupTmp removes
// cannot drift apart.
const STAGED_SUFFIX = ".parquet";

/** Local path a relation is staged to before upload. */
export function stagingPath(relation: string): string {
  return path.join(os.tmpdir(), `${relation}${STAGED_SUFFIX}`);
}

/**
 * Remove the parquet files staged during this run.
 *
 * Lambda reuses /tmp across warm invocations, so anything left behind counts against
 * ephemeralStorageSize on every later run, and competes with DuckDB if a temp_directory
 * is ever configured there.
 */
export async function cleanupTmp(): Promise<void> {
  const stagingDir = os.tmpdir();

  // Called from a finally block. A failure here must not replace the error that aborted
  // the export, or CloudWatch shows a cleanup problem instead of the real cause.
  try {
    const entries = await readdir(stagingDir);
    const staged = entries.filter((entry) => entry.endsWith(STAGED_SUFFIX));

    await Promise.all(staged.map((entry) => rm(path.join(stagingDir, entry), { force: true })));

    if (staged.length > 0) {
      log.info({ removed: staged.length }, "removed staged parquet files from tmp");
    }
  } catch (error) {
    log.warn({ error: (error as Error).message }, "failed to clean up staged parquet files");
  }
}
