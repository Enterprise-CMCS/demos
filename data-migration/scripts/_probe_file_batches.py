"""Throwaway probe: file-batch (submission session) grouping in DuckDB.

Reproduces the batch numbers quoted in the submission-reconstruction analysis.
Reads the local Postgres snapshot (mysql_raw.* + stg._valid_dlvrbl_ids) through
DuckDB's postgres scanner, so the scope filter is the real one rather than a
reimplementation. Read-only. Delete after use.
"""

from __future__ import annotations

import duckdb

from migration.lib import Env

GAP = "60 minutes"

BATCHED = f"""
CREATE OR REPLACE TEMP VIEW scoped AS
SELECT
    f.mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    f.mdcd_dlvrbl_id         AS dlvrbl_id,
    f.user_id                AS uploader_id,
    f.cmt_orgn_cd            AS origin_cd,
    f.creatd_dt              AS uploaded_at
FROM pg.mysql_raw.mdcd_dlvrbl_fil_doc f
JOIN pg.stg._valid_dlvrbl_ids v ON v.dlvrbl_id = f.mdcd_dlvrbl_id
WHERE f.dltd_ind = 0
  AND f.creatd_dt IS NOT NULL;

-- A new session starts on the first upload, on a change of uploader, or on a
-- gap wider than GAP. The fil_doc_id tiebreak keeps ordering deterministic
-- when two uploads share a timestamp.
CREATE OR REPLACE TEMP VIEW boundary AS
SELECT
    s.*,
    CASE
        WHEN lag(s.uploaded_at)  OVER w IS NULL                              THEN 1
        WHEN s.uploader_id <>    lag(s.uploader_id) OVER w                   THEN 1
        WHEN s.uploaded_at - lag(s.uploaded_at) OVER w > INTERVAL '{GAP}'    THEN 1
        ELSE 0
    END AS is_batch_start
FROM scoped s
WINDOW w AS (PARTITION BY s.dlvrbl_id ORDER BY s.uploaded_at, s.fil_doc_id);

-- Running count of session starts = the batch this file belongs to.
CREATE OR REPLACE TEMP VIEW batched AS
SELECT
    b.*,
    sum(b.is_batch_start) OVER (
        PARTITION BY b.dlvrbl_id
        ORDER BY b.uploaded_at, b.fil_doc_id
    ) AS batch_seq
FROM boundary b;
"""

QUERIES: list[tuple[str, str]] = [
    (
        "totals (expect 7874 batches / 5378 deliverables / 12682 files)",
        """
        SELECT count(DISTINCT (dlvrbl_id, batch_seq)) AS file_batches,
               count(DISTINCT dlvrbl_id)              AS deliverables,
               count(*)                               AS live_files
        FROM batched
        """,
    ),
    (
        "agreement vs status log (expect 5460 / 3898 / 1343 / 219)",
        """
        WITH b AS (
            SELECT dlvrbl_id, count(DISTINCT batch_seq) AS batches
            FROM batched GROUP BY 1
        ), s AS (
            SELECT h.mdcd_dlvrbl_id AS dlvrbl_id, count(*) AS submits
            FROM pg.mysql_raw.mdcd_dlvrbl_stus_hstry h
            JOIN pg.stg._valid_dlvrbl_ids v ON v.dlvrbl_id = h.mdcd_dlvrbl_id
            WHERE h.mdcd_dlvrbl_stus_cd = 3
            GROUP BY 1
        ), j AS (
            SELECT coalesce(b.batches, 0) AS batches,
                   coalesce(s.submits, 0) AS submits
            FROM b FULL OUTER JOIN s USING (dlvrbl_id)
        )
        SELECT count(*)                                      AS with_either,
               count(*) FILTER (batches = submits)           AS exact_match,
               count(*) FILTER (batches > submits)           AS more_batches,
               count(*) FILTER (batches < submits)           AS more_events
        FROM j
        """,
    ),
    (
        "gap-window sensitivity (batch count is a boundary count, so no second window is needed)",
        """
        WITH marked AS (
            SELECT
                s.dlvrbl_id,
                s.uploaded_at - lag(s.uploaded_at) OVER w AS gap,
                lag(s.uploaded_at)  OVER w AS prev_at,
                lag(s.uploader_id)  OVER w AS prev_uploader,
                s.uploader_id
            FROM scoped s
            WINDOW w AS (PARTITION BY s.dlvrbl_id ORDER BY s.uploaded_at, s.fil_doc_id)
        )
        SELECT
            sum(CASE WHEN prev_at IS NULL OR uploader_id <> prev_uploader
                          OR gap > INTERVAL '15 minutes' THEN 1 ELSE 0 END) AS w_15min,
            sum(CASE WHEN prev_at IS NULL OR uploader_id <> prev_uploader
                          OR gap > INTERVAL '60 minutes' THEN 1 ELSE 0 END) AS w_60min,
            sum(CASE WHEN prev_at IS NULL OR uploader_id <> prev_uploader
                          OR gap > INTERVAL '4 hours' THEN 1 ELSE 0 END)    AS w_4h,
            sum(CASE WHEN prev_at IS NULL OR uploader_id <> prev_uploader
                          OR gap > INTERVAL '24 hours' THEN 1 ELSE 0 END)   AS w_24h
        FROM marked
        """,
    ),
    (
        "batches by origin (S vs C)",
        """
        SELECT origin_cd,
               count(DISTINCT (dlvrbl_id, batch_seq)) AS batches,
               count(DISTINCT dlvrbl_id)              AS deliverables,
               count(*)                               AS files
        FROM batched GROUP BY 1 ORDER BY files DESC
        """,
    ),
]


def main() -> None:
    env = Env.load()
    con = duckdb.connect()
    con.execute("INSTALL postgres; LOAD postgres;")
    try:
        # SECURITY (CWE-89): ATTACH takes no bind parameters, so the DSN is
        # inlined with single quotes doubled -- the same treatment as duck.py
        # and crosswalk_audit.py. The value comes from the operator's own .env,
        # not from a wire, and the except clause below re-raises with only the
        # exception TYPE so credentials never reach a traceback.
        dsn = env.pg_dsn().replace("'", "''")
        con.execute(f"ATTACH '{dsn}' AS pg (TYPE postgres, READ_ONLY)")
    except Exception as e:
        raise RuntimeError(f"Postgres ATTACH failed: {type(e).__name__}") from None

    con.execute(BATCHED)
    for label, sql in QUERIES:
        print(f"\n=== {label} ===")
        print(con.sql(sql))


if __name__ == "__main__":
    main()
