"""Dump the live MySQL source's lookup-table rows to reports/reference_data/.

This is the row-data companion to ``migrate schema-snapshot``. The snapshot
captures *metadata* (columns, view bodies, table stats) but not the rows that
crosswalk authoring actually needs: the source declares **no** enums, so its
value domains live entirely in the ~68 ``*_rfrnc`` lookup tables (e.g.
``mdcd_demo_stus_rfrnc``, ``mdcd_demo_type_rfrnc``,
``mdcd_dlvrbl_stus_rfrnc``). Those rows -- plus the result sets of the source
views (notably ``v_demo_status_dtl``, which derives the approval status the
``demo_status`` crosswalk must reproduce) -- are the authoritative input for
``sql/04_crosswalks/*``.

Like the snapshot, this reads through the DuckDB sidecar the toolkit already
depends on: it attaches the source MySQL database ``READ_ONLY`` and runs each
``SELECT`` through DuckDB's ``mysql_query`` passthrough. Nothing is written
back to MySQL and no credentials are persisted to disk. It does not require a
prior ``load_full`` -- the point is to author crosswalks *before* the bulk
load. Each artifact is a deterministic, diff-friendly CSV; a per-table or
per-view failure is logged and skipped so one bad object never aborts the run.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import urlparse

from migration.lib import (
    REFERENCE_DATA_DIR,
    Env,
    die,
    file_stamp,
    log,
    rel,
    ts,
)

# Reuse the snapshot's tested DuckDB/CSV helpers rather than duplicate them.
from migration.phases.schema_snapshot import (
    _mysql_attach_dsn,
    _passthrough,
    _write_csv,
)

# The source views worth materializing as reference data. Their result sets
# (not their DDL, which the snapshot already captures) encode business rules:
# status derivation and the demonstration-type vocabulary.
_VIEWS: tuple[str, ...] = (
    "v_demo_status_dtl",
    "v_demo_mgmt_demo_types",
    "v_demo_mgmt_mrt_demo_types",
    "v_app_mgmt_demo_types",
    "v_app_mgmt_demo_types_incl_dltd",
)

# Lookup tables follow the `*_rfrnc` naming convention. Backslash-escaped `_`
# so LIKE treats it literally; the trailing `_rfrnc` anchors the suffix.
_RFRNC_LIST_SQL = (
    "SELECT table_name FROM information_schema.tables "
    "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' "
    "AND table_name LIKE '%\\_rfrnc' ORDER BY table_name"
)

_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z0-9_]+$")


def _is_safe_identifier(name: str) -> bool:
    """True when ``name`` is a bare identifier safe to inline into SQL.

    Object names come from ``information_schema`` (or the static ``_VIEWS``
    list), but inlining is still guarded so a surprising name can never inject
    SQL: only ASCII letters, digits, and underscores are accepted.
    """
    return bool(_SAFE_IDENTIFIER.match(name or ""))


def _dump_sql(name: str) -> str:
    """Return the row-dump query for one validated table/view name.

    ``ORDER BY 1`` (first column -- the code/PK for these lookups) keeps the
    CSV output stable across runs for review-friendly diffs.
    """
    return f"SELECT * FROM {name} ORDER BY 1"


def run_reference_data_dump() -> None:
    """Dump every `*_rfrnc` table and the source views to reports/reference_data/.

    Attaches the source database READ_ONLY through the DuckDB MySQL scanner,
    discovers the lookup tables by name, and writes one CSV per table and per
    view plus a ``_manifest.json`` audit record. A failure to attach (MySQL
    unreachable) is fatal; an individual object that errors is logged and
    skipped so the rest of the dump still completes.
    """
    import duckdb

    env = Env.load()
    REFERENCE_DATA_DIR.mkdir(parents=True, exist_ok=True)
    dsn = _mysql_attach_dsn(env.mysql_url, env.mysql_db)

    con = duckdb.connect()
    try:
        con.execute("INSTALL mysql_scanner; LOAD mysql_scanner;")
        dsn_literal = dsn.replace("'", "''")
        try:
            con.execute(f"ATTACH '{dsn_literal}' AS src (TYPE mysql, READ_ONLY)")
        except Exception as e:
            die(f"could not attach MySQL source via DuckDB: {e}")

        try:
            _, rfrnc_rows = _passthrough(con, _RFRNC_LIST_SQL)
        except Exception as e:
            die(f"could not list reference tables: {e}")
        rfrnc_tables = [str(r[0]) for r in rfrnc_rows]
        log(f"found {len(rfrnc_tables)} reference (*_rfrnc) tables")

        counts: dict[str, int] = {}
        for name in [*rfrnc_tables, *_VIEWS]:
            if not _is_safe_identifier(name):
                log(f"WARNING: skipping unsafe object name: {name!r}")
                continue
            out = REFERENCE_DATA_DIR / f"{name}.csv"
            try:
                header, rows = _passthrough(con, _dump_sql(name))
            except Exception as e:
                log(f"WARNING: dump of {name} failed, skipping: {e}")
                continue
            counts[f"{name}.csv"] = _write_csv(out, header, rows)
            log(f"wrote {rel(out)} ({counts[f'{name}.csv']} rows)")
    finally:
        con.close()

    manifest = {
        "captured_at": ts(),
        "stamp": file_stamp(),
        "mysql_db": env.mysql_db or urlparse(env.mysql_url).path.lstrip("/"),
        "duckdb_version": duckdb.__version__,
        "row_counts": counts,
    }
    manifest_path: Path = REFERENCE_DATA_DIR / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    log(f"wrote {rel(manifest_path)}")

    # Columnar companions for offline DuckDB analysis (role B); additive.
    from migration.duck import csv_dir_to_parquet

    csv_dir_to_parquet(REFERENCE_DATA_DIR)
