"""Throwaway probe: file-batch (submission session) grouping against LIVE MySQL.

Companion to _probe_file_batches.py, which reads the local Postgres snapshot.
This one talks to the PMDA source directly through DuckDB's MySQL extension
(see .agents/skills/mysql-ducksplorer), so it also answers "has the snapshot
drifted from prod?".

Two things the snapshot version got for free and this one must rebuild:

  1. Scope. stg._valid_dlvrbl_ids lives in Postgres. Here the filter cascade is
     reimplemented in DuckDB from the same source columns: the demonstration
     allowlist (11-W-#####/region shape, 2-letter state, sane dates), the
     deliverable allowlist (sane dates, parent demo kept), and the keep/drop
     CSV overrides -- which DuckDB reads directly off disk.
  2. Query shape. DuckDB's MySQL scanner aborts (SIGABRT) on complex remote
     joins; it died on a 4-way join earlier in this investigation. So every
     remote read below is a flat single-table projection materialized into a
     DuckDB-local table, and all joins/windows run locally afterwards.

Read-only. Delete after use.
"""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote, urlparse

import duckdb

from migration.lib import Env

REPO_ROOT = Path(__file__).resolve().parent.parent
KEEP_CSV = REPO_ROOT / "reports" / "filter" / "keep_ids.csv"
DROP_CSV = REPO_ROOT / "reports" / "filter" / "drop_ids.csv"

_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _safe_ident(name: str, what: str) -> str:
    """Return ``name`` when it is a bare SQL identifier, else raise.

    DuckDB's scanner takes no bind parameters, so table names are inlined.
    Every identifier is validated against ``[A-Za-z_][A-Za-z0-9_]*`` before
    interpolation -- even though these come from a module-level literal rather
    than user input -- to match the repo-wide rule in SECURITY_REVIEW.md
    (CWE-89) and keep the pattern uniform for SAST.
    """
    if not _SAFE_IDENTIFIER.match(name or ""):
        raise ValueError(f"unsafe {what} identifier: {name!r}")
    return name


GAP = "60 minutes"

# Flat single-table pulls only -- see the SIGABRT note in the docstring.
PULLS: dict[str, str] = {
    "mdcd_demo": """
        SELECT mdcd_demo_id, mdcd_demo_num, geo_ansi_state_cd,
               creatd_dt, state_prfmnc_yr_strt_dt
        FROM my.mdcd_demo
    """,
    "mdcd_dlvrbl": """
        SELECT mdcd_dlvrbl_id, mdcd_demo_id, creatd_dt, dlvrbl_due_dt,
               mdcd_dlvrbl_crnt_stus_cd
        FROM my.mdcd_dlvrbl
    """,
    "fil_doc": """
        SELECT mdcd_dlvrbl_fil_doc_id, mdcd_dlvrbl_id, user_id, cmt_orgn_cd,
               creatd_dt, dltd_ind
        FROM my.mdcd_dlvrbl_fil_doc
    """,
    "stus_hstry": """
        SELECT mdcd_dlvrbl_stus_hstry_id, mdcd_dlvrbl_id, mdcd_dlvrbl_stus_cd,
               creatd_dt, creatd_user_id, dltd_ind
        FROM my.mdcd_dlvrbl_stus_hstry
    """,
}

# migration.normalize_medicaid_id(x) == normalize_waiver_number(x, '11'),
# transliterated to DuckDB. Only its NULL/non-NULL result matters to the
# filter, so this returns the canonical id or NULL exactly as the SQL fn does.
SCOPE = f"""
CREATE OR REPLACE TEMP VIEW demo_norm AS
WITH stripped AS (
    SELECT
        mdcd_demo_id,
        geo_ansi_state_cd,
        creatd_dt,
        state_prfmnc_yr_strt_dt,
        regexp_replace(upper(CAST(mdcd_demo_num AS VARCHAR)), '[-/[:space:]]', '', 'g') AS s
    FROM mdcd_demo
), parsed AS (
    -- The shape test must stay INSIDE the projection, not in a WHERE. The
    -- Postgres original is a scalar function returning NULL for a malformed
    -- number; filtering rows out here instead would hide exactly the demos the
    -- allowlist is supposed to exclude.
    SELECT
        *,
        CASE WHEN regexp_matches(s, '^11W[0-9]{{6,7}}$')
             THEN substring(s, 4, 5) END AS project,
        CASE WHEN regexp_matches(s, '^11W[0-9]{{6,7}}$') THEN
            CASE
                WHEN length(s) = 10 AND right(s, 2) = '10'    THEN '10'
                WHEN length(s) = 9  AND substring(s, 9) = '0' THEN '10'
                WHEN length(s) = 9                            THEN substring(s, 9)
            END
        END AS region
    FROM stripped
)
SELECT
    mdcd_demo_id, geo_ansi_state_cd, creatd_dt, state_prfmnc_yr_strt_dt,
    CASE
        WHEN region IS NOT NULL
         AND project <> '00000'
         AND regexp_matches('11-W-' || project || '/' || region,
                            '^11-W-[0-9]{{5}}/(10|[1-9])$')
        THEN '11-W-' || project || '/' || region
    END AS medicaid_id
FROM parsed;

CREATE OR REPLACE TEMP VIEW keep_ids AS
SELECT CAST(legacy_id AS BIGINT) AS legacy_id, entity
FROM read_csv_auto('{KEEP_CSV}', header = true);

CREATE OR REPLACE TEMP VIEW drop_ids AS
SELECT CAST(legacy_id AS BIGINT) AS legacy_id, entity
FROM read_csv_auto('{DROP_CSV}', header = true);

-- stg._valid_demo_ids
CREATE OR REPLACE TEMP VIEW valid_demo_ids AS
SELECT demo_id FROM (
    SELECT d.mdcd_demo_id AS demo_id
    FROM mdcd_demo d
    EXCEPT
    SELECT n.mdcd_demo_id
    FROM demo_norm n
    WHERE n.medicaid_id IS NULL
       OR (n.geo_ansi_state_cd IS NOT NULL
           AND NOT regexp_matches(CAST(n.geo_ansi_state_cd AS VARCHAR), '^[A-Z]{{2}}$'))
       OR n.creatd_dt IS NULL
       OR (n.state_prfmnc_yr_strt_dt IS NOT NULL
           AND (extract(year FROM n.state_prfmnc_yr_strt_dt) < 1990
             OR extract(year FROM n.state_prfmnc_yr_strt_dt) > 2099))
    UNION
    SELECT k.legacy_id
    FROM keep_ids k
    WHERE k.entity = 'mdcd_demo'
      AND k.legacy_id IN (SELECT mdcd_demo_id FROM mdcd_demo)
)
WHERE demo_id NOT IN (SELECT legacy_id FROM drop_ids WHERE entity = 'mdcd_demo');

-- stg._valid_dlvrbl_ids
CREATE OR REPLACE TEMP VIEW valid_dlvrbl_ids AS
SELECT dlvrbl_id FROM (
    SELECT d.mdcd_dlvrbl_id AS dlvrbl_id
    FROM mdcd_dlvrbl d
    EXCEPT
    SELECT d.mdcd_dlvrbl_id
    FROM mdcd_dlvrbl d
    WHERE d.creatd_dt IS NULL
       OR (d.dlvrbl_due_dt IS NOT NULL
           AND (extract(year FROM d.dlvrbl_due_dt) < 1990
             OR extract(year FROM d.dlvrbl_due_dt) > 2099))
       OR NOT EXISTS (SELECT 1 FROM valid_demo_ids v WHERE v.demo_id = d.mdcd_demo_id)
    UNION
    SELECT k.legacy_id
    FROM keep_ids k
    WHERE k.entity = 'mdcd_dlvrbl'
      AND k.legacy_id IN (SELECT mdcd_dlvrbl_id FROM mdcd_dlvrbl)
)
WHERE dlvrbl_id NOT IN (SELECT legacy_id FROM drop_ids WHERE entity = 'mdcd_dlvrbl');
"""

BATCHED = f"""
CREATE OR REPLACE TEMP VIEW scoped AS
SELECT
    f.mdcd_dlvrbl_fil_doc_id AS fil_doc_id,
    f.mdcd_dlvrbl_id         AS dlvrbl_id,
    f.user_id                AS uploader_id,
    f.cmt_orgn_cd            AS origin_cd,
    f.creatd_dt              AS uploaded_at
FROM fil_doc f
JOIN valid_dlvrbl_ids v ON v.dlvrbl_id = f.mdcd_dlvrbl_id
WHERE f.dltd_ind = 0
  AND f.creatd_dt IS NOT NULL;

-- A new session starts on the first upload, on a change of uploader, or on a
-- gap wider than GAP. The fil_doc_id tiebreak keeps ordering deterministic
-- when two uploads share a timestamp.
CREATE OR REPLACE TEMP VIEW boundary AS
SELECT
    s.*,
    CASE
        WHEN lag(s.uploaded_at) OVER w IS NULL                            THEN 1
        WHEN s.uploader_id <> lag(s.uploader_id) OVER w                   THEN 1
        WHEN s.uploaded_at - lag(s.uploaded_at) OVER w > INTERVAL '{GAP}' THEN 1
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
        "scope cascade (snapshot: 288->210 demos, 11651->10684 deliverables)",
        """
        SELECT (SELECT count(*) FROM mdcd_demo)         AS demos_src,
               (SELECT count(*) FROM valid_demo_ids)    AS demos_in_scope,
               (SELECT count(*) FROM mdcd_dlvrbl)       AS dlvrbl_src,
               (SELECT count(*) FROM valid_dlvrbl_ids)  AS dlvrbl_in_scope
        """,
    ),
    (
        "totals (snapshot: 7874 batches / 5378 deliverables / 12682 files)",
        """
        SELECT count(DISTINCT (dlvrbl_id, batch_seq)) AS file_batches,
               count(DISTINCT dlvrbl_id)              AS deliverables,
               count(*)                               AS live_files
        FROM batched
        """,
    ),
    (
        "agreement vs status log (snapshot: 5460 / 3898 / 1343 / 219)",
        """
        WITH b AS (
            SELECT dlvrbl_id, count(DISTINCT batch_seq) AS batches
            FROM batched GROUP BY 1
        ), s AS (
            SELECT h.mdcd_dlvrbl_id AS dlvrbl_id, count(*) AS submits
            FROM stus_hstry h
            JOIN valid_dlvrbl_ids v ON v.dlvrbl_id = h.mdcd_dlvrbl_id
            WHERE h.mdcd_dlvrbl_stus_cd = 3
            GROUP BY 1
        ), j AS (
            SELECT coalesce(b.batches, 0) AS batches,
                   coalesce(s.submits, 0) AS submits
            FROM b FULL OUTER JOIN s USING (dlvrbl_id)
        )
        SELECT count(*)                            AS with_either,
               count(*) FILTER (batches = submits) AS exact_match,
               count(*) FILTER (batches > submits) AS more_batches,
               count(*) FILTER (batches < submits) AS more_events
        FROM j
        """,
    ),
    (
        "batches by origin (snapshot: S 7633/5353/12339, C 241/220/343)",
        """
        SELECT origin_cd,
               count(DISTINCT (dlvrbl_id, batch_seq)) AS batches,
               count(DISTINCT dlvrbl_id)              AS deliverables,
               count(*)                               AS files
        FROM batched GROUP BY 1 ORDER BY files DESC
        """,
    ),
    (
        "gap-window sensitivity (all origins)",
        """
        WITH marked AS (
            SELECT
                s.dlvrbl_id,
                s.uploaded_at - lag(s.uploaded_at) OVER w AS gap,
                lag(s.uploaded_at) OVER w AS prev_at,
                lag(s.uploader_id) OVER w AS prev_uploader,
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
]


def attach_mysql(con: duckdb.DuckDBPyConnection) -> None:
    """ATTACH live MySQL without ever letting the DSN reach stdout or a traceback."""
    u = urlparse(Env.load().mysql_url)
    parts = {
        "host": u.hostname or "",
        "port": str(u.port or 3306),
        "user": unquote(u.username or ""),
        "password": unquote(u.password or ""),
        "database": (u.path or "/").lstrip("/"),
    }
    dsn = " ".join(f"{k}={v}" for k, v in parts.items())
    con.execute("INSTALL mysql; LOAD mysql;")
    try:
        # SECURITY (CWE-89): ATTACH takes no bind parameters, so the DSN is
        # inlined with single quotes doubled -- the same treatment as duck.py
        # and crosswalk_audit.py. The value comes from the operator's own .env
        # (MYSQL_URL), not from a wire, and the except clause below re-raises
        # with only the exception TYPE so credentials never reach a traceback.
        con.execute(f"ATTACH '{dsn.replace(chr(39), chr(39) * 2)}' AS my (TYPE mysql, READ_ONLY)")
    except Exception as e:
        raise RuntimeError(f"MySQL ATTACH failed: {type(e).__name__}") from None


def main() -> None:
    con = duckdb.connect()
    attach_mysql(con)

    print("pulling source tables (flat projections; joins run locally)")
    for name, sql in PULLS.items():
        # SECURITY (CWE-89): both halves are inlined because DuckDB takes no
        # bind parameters here. `tbl` is allowlist-validated; `sql` is a static
        # query string from the PULLS literal above, never runtime input.
        tbl = _safe_ident(name, "pull table")
        con.execute(f"CREATE OR REPLACE TABLE {tbl} AS {sql}")
        n = con.execute(f"SELECT count(*) FROM {tbl}").fetchone()[0]
        print(f"  {tbl:<12} {n:>7,} rows")

    con.execute(SCOPE)
    con.execute(BATCHED)

    for label, sql in QUERIES:
        print(f"\n=== {label} ===")
        print(con.sql(sql))


if __name__ == "__main__":
    main()
