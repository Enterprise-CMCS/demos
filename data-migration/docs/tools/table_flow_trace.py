"""Emit a deterministic, normalized run trace of a table's migration flow.

This is the live, Docker-gated half of the per-table flow docs. It stands up a
throwaway Postgres exactly as the real build does (00_init -> pinned Prisma DDL
-> drop FKs -> 01_ddl_supplements -> seeds -> crosswalks -> 05_id_maps), rebuilds
the source side as a typed ``mysql_raw`` skeleton seeded from a curated fixture,
then applies the real stg / app / parity SQL and records what happened
to every source row. The output is two committed artifacts:

* ``docs/shared/generated/live/<table>-flow-trace.adoc`` -- the AsciiDoc trace
  partial included by ``docs/operator/reference-<table>-flow.adoc``.
* ``tests/sql/fixtures/<flow>/expected_manifest.json`` -- the per-stage counts
  and per-row dispositions the offline + live tests anchor against.

Determinism: minted UUIDs (random per run) are normalized to stable
``<TABLE>_UUID_NN`` tokens ordered by the natural key, and minted sequence
numbers (e.g. the 21-W chip fallback) are masked to ``…`` so re-running on the
same fixture yields a byte-identical trace (CI checks ``git diff --exit-code``).

Run it via the Make target (resolves/boots the harness Postgres for you):

    make demonstration-flow-trace

or directly, against an explicit DSN:

    PG_TEST_DSN=postgresql://... uv run python docs/tools/table_flow_trace.py \
        --table demonstration
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

REPO_ROOT = Path(__file__).resolve().parents[2]
# tests.sql._skeleton is not an installed package; make it importable when this
# module is run as a script (migration.* is already installed/importable).
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from migration.lib import REPORTS_DIR, SQL_DIR, copy_csv_into_table  # noqa: E402
from migration.phases.init_pg import _load_crosswalk_registry  # noqa: E402
from tests.sql._skeleton import create_mysql_raw_skeleton  # noqa: E402

INIT_DIR = SQL_DIR / "00_init"
SCHEMAS_SQL = INIT_DIR / "01_schemas.sql"
SUPPL_DIR = SQL_DIR / "01_ddl_supplements"
SEEDS_STATIC_DIR = SQL_DIR / "02_seeds_static"
SEEDS_LIMITERS_DIR = SQL_DIR / "03_seeds_limiters"
CROSSWALK_DIR = SQL_DIR / "04_crosswalks"
IDMAP_DIR = SQL_DIR / "05_id_maps"
STG_DIR = SQL_DIR / "10_stg"
APP_DIR = SQL_DIR / "20_app"
APP_ASSOC_DIR = SQL_DIR / "21_app_associative"
PARITY_DIR = SQL_DIR / "99_parity"
PIN_FILE = REPORTS_DIR / "prisma_ddl.sha256"
JSONB_SCHEMA_DIR = REPORTS_DIR / "jsonb_schemas"

GENERATED_LIVE_DIR = REPO_ROOT / "docs" / "shared" / "generated" / "live"
ENSURE_TEST_DB = REPO_ROOT / "scripts" / "ensure_test_db.sh"

# Drop only FOREIGN KEY constraints in demos_app, exactly as init_pg.run_ddl
# does for the bulk build. CHECK constraints are KEPT on purpose: the curated
# fixture is business-valid, so the real loader's output must satisfy
# check_demonstration_non_null_fields_when_approved and friends -- that is part
# of what this trace validates. (The app-layers harness drops CHECKs because
# its fake data is not business-valid; this harness must not.)
_DROP_FKS = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid::regclass AS tbl
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
     WHERE c.contype = 'f' AND n.nspname = 'demos_app'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END
$$;
"""


def _pinned_ddl_path() -> Path:
    sha = PIN_FILE.read_text(encoding="utf-8").split()[0]
    return REPO_ROOT / "state" / "prisma_ddl" / f"{sha}.sql"


def _apply_file(conn: Any, path: Path) -> None:
    # SECURITY: the Snyk "SQL injection" finding here is a false positive.
    # `path` is always a repo-controlled .sql file (schema DDL, the sha256-
    # pinned Prisma DDL, curated fixtures, crosswalk files) applied verbatim to
    # a throwaway scratch DB -- the by-design "repo IS the SQL" pattern (cf.
    # lib.apply_dir). No database or user input reaches this call.
    conn.execute(path.read_text(encoding="utf-8"))


def _apply_dir(conn: Any, directory: Path) -> None:
    for f in sorted(directory.glob("*.sql")):
        conn.execute(f.read_text(encoding="utf-8"))


def _load_jsonb_schemas(conn: Any) -> None:
    for path in sorted(JSONB_SCHEMA_DIR.glob("*.schema.json")):
        name = path.name.removesuffix(".schema.json")
        conn.execute(
            """
            INSERT INTO migration.jsonb_schemas (name, schema, registered_at)
            VALUES (%s, %s::jsonb, now())
            ON CONFLICT (name) DO UPDATE
              SET schema = EXCLUDED.schema, registered_at = EXCLUDED.registered_at
            """,
            (name, path.read_text(encoding="utf-8")),
        )


def _standup(conn: Any) -> None:
    """Build the real demos_app + migration schemas, mirroring init_pg.run_ddl."""
    conn.execute("DROP SCHEMA IF EXISTS demos_app, migration, stg, mysql_raw CASCADE")
    _apply_dir(conn, INIT_DIR)
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    _apply_file(conn, SCHEMAS_SQL)
    _apply_file(conn, _pinned_ddl_path())
    conn.execute(_DROP_FKS)
    _apply_dir(conn, SUPPL_DIR)
    _load_jsonb_schemas(conn)
    _apply_dir(conn, SEEDS_STATIC_DIR)
    _apply_dir(conn, SEEDS_LIMITERS_DIR)


def _build_source(conn: Any, seed_path: Path) -> None:
    """Recreate mysql_raw as a typed skeleton and seed the curated fixture."""
    create_mysql_raw_skeleton(conn)
    _apply_file(conn, seed_path)


def _run_crosswalks(conn: Any) -> None:
    """Mirror init_pg.run_crosswalks: creators -> CSV load -> id maps.

    The ``*_check.sql`` completeness gates are intentionally skipped here: the
    skeleton creates every snapshot table (including ones the curated fixture
    does not seed, e.g. ``role_rfrnc``, ``mdcd_dlvrbl``), and several checks
    fail-closed on a present-but-empty source (CODE_REVIEW H4).  Those gates are
    validated by ``tests/sql/test_crosswalk_checks.py`` against purpose-built
    fixtures; this harness only needs the crosswalk *tables* populated so the
    stg/app/parity SQL can join to them.
    """
    files = sorted(CROSSWALK_DIR.glob("*.sql"))
    creators = [f for f in files if not f.name.endswith("_check.sql")]
    for f in creators:
        _apply_file(conn, f)
    for table, csv_name, columns in _load_crosswalk_registry():
        copy_csv_into_table(
            conn, "mysql_raw", table, REPORTS_DIR / csv_name, header_expect=columns
        )
    _apply_dir(conn, IDMAP_DIR)


def _run_build(conn: Any) -> None:
    """Apply the real stg / app / associative / parity SQL in order."""
    for directory in (STG_DIR, APP_DIR, APP_ASSOC_DIR, PARITY_DIR):
        _apply_dir(conn, directory)


def _scalar(conn: Any, sql: str) -> int:
    with conn.cursor() as cur:
        cur.execute(sql)
        row = cur.fetchone()
    return int(row[0]) if row else 0


def _view_count(conn: Any, relname: str) -> int | None:
    """Count rows in a relation, or None when it does not exist."""
    if _scalar(conn, f"SELECT (to_regclass('{relname}') IS NOT NULL)::int") == 0:
        return None
    return _scalar(conn, f"SELECT count(*) FROM {relname}")


def _rows(conn: Any, sql: str) -> list[tuple[Any, ...]]:
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


# --------------------------------------------------------------------------
# demonstration flow spec
# --------------------------------------------------------------------------

_DISPOSITION_ORDER = {
    "loaded": 0,
    "held_back_approved_field": 1,
    "held_back_state": 2,
    "excluded_soft_delete": 3,
    "filtered_bad_project_number": 4,
}


def _mask_minted_chip(chip_id: str | None) -> str | None:
    """Mask the 5-digit minted sequence in a 21-W chip id (region kept)."""
    if not chip_id:
        return chip_id
    parts = chip_id.split("/")
    if len(parts) == 2 and parts[0].startswith("21-W-"):
        return f"21-W-…/{parts[1]}"
    return "…"


def _demonstration_manifest(conn: Any) -> dict[str, Any]:
    loaded = _rows(
        conn,
        """
        SELECT d.id::text, d.medicaid_id, d.status_id, d.current_phase_id, d.chip_id,
               (r.chip_id_legacy IS NULL) AS chip_minted
          FROM demos_app.demonstration d
          LEFT JOIN stg.demonstration_resolved r ON r.new_uuid = d.id
         ORDER BY d.medicaid_id
        """,
    )
    token_by_uuid = {row[0]: f"DEMONSTRATION_UUID_{i:02d}" for i, row in enumerate(loaded, 1)}

    rows: list[dict[str, Any]] = []
    for uuid_str, medicaid_id, status_id, phase_id, chip_id, chip_minted in loaded:
        rows.append({
            "medicaid_id": medicaid_id,
            "uuid_token": token_by_uuid[uuid_str],
            "disposition": "loaded",
            "status_id": status_id,
            "current_phase_id": phase_id,
            "chip_source": "minted" if chip_minted else "preserved",
            "chip_id": _mask_minted_chip(chip_id) if chip_minted else chip_id,
        })

    for medicaid_id, status_cd, reason in _rows(
        conn,
        """
        SELECT medicaid_id, status_cd, reason
          FROM migration._parity_approved_demo_held
         ORDER BY medicaid_id
        """,
    ):
        rows.append({
            "medicaid_id": medicaid_id,
            "disposition": "held_back_approved_field",
            "status_id": "Approved",
            "reason": reason,
        })

    # Resolved-but-not-loaded for a reason other than the recorded approved
    # hold-back is an unresolvable state (loader inner-joins state_region).
    for medicaid_id, state_id in _rows(
        conn,
        """
        SELECT r.medicaid_id, r.state_id
          FROM stg.demonstration_resolved r
          LEFT JOIN demos_app.demonstration d ON d.id = r.new_uuid
          LEFT JOIN migration._parity_approved_demo_held h ON h.demonstration_id = r.new_uuid
         WHERE d.id IS NULL AND h.demonstration_id IS NULL
         ORDER BY r.medicaid_id
        """,
    ):
        rows.append({
            "medicaid_id": medicaid_id,
            "disposition": "held_back_state",
            "reason": (
                "NULL state code; no migration.state_region row"
                if state_id is None
                else f"state '{state_id}' not in migration.state_region"
            ),
        })

    # Valid (minted in id map) but dropped at the resolved view -> soft-deleted.
    for (mdcd_num,) in _rows(
        conn,
        """
        SELECT s.mdcd_demo_num
          FROM stg._valid_demo_ids v
          JOIN mysql_raw.mdcd_demo s ON s.mdcd_demo_id = v.demo_id
          LEFT JOIN stg.demonstration_resolved r
                 ON r.new_uuid = (SELECT new_uuid FROM migration._id_map_mdcd_demo m
                                   WHERE m.legacy_int_id = v.demo_id)
         WHERE r.new_uuid IS NULL
         ORDER BY s.mdcd_demo_num
        """,
    ):
        rows.append({
            "medicaid_id": mdcd_num,
            "disposition": "excluded_soft_delete",
            "reason": "soft-deleted (dltd_ind=1); excluded at stg.demonstration_resolved",
        })

    # In source but never PMDA-valid -> filtered by stg._valid_demo_ids.
    for (mdcd_num,) in _rows(
        conn,
        """
        SELECT s.mdcd_demo_num
          FROM mysql_raw.mdcd_demo s
          LEFT JOIN stg._valid_demo_ids v ON v.demo_id = s.mdcd_demo_id
         WHERE v.demo_id IS NULL
         ORDER BY s.mdcd_demo_num
        """,
    ):
        rows.append({
            "medicaid_id": mdcd_num,
            "disposition": "filtered_bad_project_number",
            "reason": "fails the 11-W-NNNNN/R project-number rule in stg._valid_demo_ids",
        })

    rows.sort(key=lambda r: (_DISPOSITION_ORDER[r["disposition"]], r["medicaid_id"] or ""))

    stage_counts = {
        "mysql_raw.mdcd_demo": _scalar(conn, "SELECT count(*) FROM mysql_raw.mdcd_demo"),
        "stg._valid_demo_ids": _scalar(conn, "SELECT count(*) FROM stg._valid_demo_ids"),
        "migration._id_map_mdcd_demo": _scalar(
            conn, "SELECT count(*) FROM migration._id_map_mdcd_demo"
        ),
        "stg.demonstration_resolved": _scalar(
            conn, "SELECT count(*) FROM stg.demonstration_resolved"
        ),
        "demos_app.application (Demonstration)": _scalar(
            conn,
            "SELECT count(*) FROM demos_app.application WHERE application_type_id = 'Demonstration'",
        ),
        "demos_app.demonstration": _scalar(conn, "SELECT count(*) FROM demos_app.demonstration"),
        "migration._parity_demonstration_id_provenance": _view_count(
            conn, "migration._parity_demonstration_id_provenance"
        ),
        "migration._parity_demonstration_completeness": _view_count(
            conn, "migration._parity_demonstration_completeness"
        ),
        "migration._parity_approved_demo_held": _view_count(
            conn, "migration._parity_approved_demo_held"
        ),
    }

    return {
        "table": "demonstration",
        "source_anchor": "mysql_raw.mdcd_demo",
        "generated_by": "docs/tools/table_flow_trace.py --table demonstration",
        "fixture": "tests/sql/fixtures/demo_flow/seed_mdcd_demo.sql",
        "stage_counts": stage_counts,
        "rows": rows,
    }


_STAGE_LABELS = {
    "mysql_raw.mdcd_demo": "`mysql_raw.mdcd_demo` (source rows seeded by the fixture)",
    "stg._valid_demo_ids": "`stg._valid_demo_ids` (passed the PMDA project-number filter)",
    "migration._id_map_mdcd_demo": "`migration._id_map_mdcd_demo` (UUID minted per valid id)",
    "stg.demonstration_resolved": "`stg.demonstration_resolved` (projected; soft-deletes dropped)",
    "demos_app.application (Demonstration)": "`demos_app.application` (the IS-A anchor row)",
    "demos_app.demonstration": "`demos_app.demonstration` (loaded)",
    "migration._parity_demonstration_id_provenance":
        "parity 6: `_parity_demonstration_id_provenance` (must be 0)",
    "migration._parity_demonstration_completeness":
        "parity 8: `_parity_demonstration_completeness` (resolved but unloaded)",
    "migration._parity_approved_demo_held":
        "parity 13: `_parity_approved_demo_held` (non-gating hold-backs)",
}

_DISPOSITION_LABELS = {
    "loaded": "loaded",
    "held_back_approved_field": "held back (Approved; missing required field)",
    "held_back_state": "held back (state not in state_region)",
    "excluded_soft_delete": "excluded (soft-deleted)",
    "filtered_bad_project_number": "filtered (bad project number)",
}


def _esc(value: Any) -> str:
    if value is None:
        return "—"
    return str(value).replace("|", "\\|")


def _render_demonstration_trace(manifest: dict[str, Any]) -> str:
    out: list[str] = [
        "// Generated by docs/tools/table_flow_trace.py --table demonstration.",
        "// Do not edit by hand; rerun `make demonstration-flow-trace`.",
        "// Minted UUIDs are normalized to stable DEMONSTRATION_UUID_NN tokens",
        "// (ordered by medicaid_id) and minted 21-W chip sequence numbers are",
        "// masked to '…', so re-running on the same fixture is byte-identical.",
        "",
        ".Stage row counts (curated fixture)",
        "[%header%autowidth]",
        "|===",
        "| Stage | Rows",
        "",
    ]
    for key, label in _STAGE_LABELS.items():
        value = manifest["stage_counts"].get(key)
        out.append(f"| {label} | {'—' if value is None else value}")
    out += [
        "|===",
        "",
        ".Per-demonstration disposition (UUIDs normalized to tokens)",
        "[%header%autowidth]",
        "|===",
        "| medicaid_id | UUID | Disposition | status_id | current_phase_id | chip_id | Reason",
        "",
    ]
    for row in manifest["rows"]:
        chip = row.get("chip_id")
        if row.get("chip_source") == "minted" and chip:
            chip = f"{chip} (minted)"
        elif row.get("chip_source") == "preserved" and chip:
            chip = f"{chip} (preserved)"
        out.append(
            "| `{mid}` | {tok} | {disp} | {st} | {ph} | {chip} | {why}".format(
                mid=_esc(row.get("medicaid_id")),
                tok=row.get("uuid_token", "—"),
                disp=_DISPOSITION_LABELS[row["disposition"]],
                st=_esc(row.get("status_id")),
                ph=_esc(row.get("current_phase_id")),
                chip=_esc(chip),
                why=_esc(row.get("reason")),
            )
        )
    out += ["|===", ""]
    return "\n".join(out)


# --------------------------------------------------------------------------
# amendment flow spec
# --------------------------------------------------------------------------

_AMENDMENT_DISPOSITION_ORDER = {
    "loaded": 0,
    "held_back_parent": 1,
    "excluded_soft_delete": 2,
    "filtered_invalid": 3,
}


def _amendment_manifest(conn: Any) -> dict[str, Any]:
    loaded = _rows(
        conn,
        """
        SELECT s.mdcd_demo_amndmt_id, a.id::text, s.mdcd_demo_amndmt_name,
               a.status_id, a.current_phase_id, a.signature_level_id, pd.mdcd_demo_num
          FROM demos_app.amendment a
          JOIN migration._id_map_mdcd_demo_amndmt am ON am.new_uuid = a.id
          JOIN mysql_raw.mdcd_demo_amndmt s          ON s.mdcd_demo_amndmt_id = am.legacy_int_id
          LEFT JOIN migration._id_map_mdcd_demo dm   ON dm.new_uuid = a.demonstration_id
          LEFT JOIN mysql_raw.mdcd_demo pd           ON pd.mdcd_demo_id = dm.legacy_int_id
         ORDER BY s.mdcd_demo_amndmt_id
        """,
    )
    token_by_id = {row[0]: f"AMENDMENT_UUID_{i:02d}" for i, row in enumerate(loaded, 1)}

    rows: list[dict[str, Any]] = []
    for amndmt_id, _uuid, name, status_id, phase_id, signature_id, parent_mid in loaded:
        rows.append({
            "amndmt_id": amndmt_id,
            "name": name,
            "uuid_token": token_by_id[amndmt_id],
            "disposition": "loaded",
            "parent_medicaid_id": parent_mid,
            "status_id": status_id,
            "current_phase_id": phase_id,
            "signature_level_id": signature_id,
        })

    # Resolved (so minted + projected) but not loaded: the loader inner-joins a
    # LOADED parent demonstration, so a pending-only/unmapped or held-back parent
    # holds the amendment back (logged non-gating by sql/99_parity/52).
    for amndmt_id, name, parent_mid, reason in _rows(
        conn,
        """
        SELECT s.mdcd_demo_amndmt_id, s.mdcd_demo_amndmt_name, pd.mdcd_demo_num, h.reason
          FROM migration._parity_amendment_held h
          JOIN migration._id_map_mdcd_demo_amndmt am ON am.new_uuid = h.amendment_uuid
          JOIN mysql_raw.mdcd_demo_amndmt s          ON s.mdcd_demo_amndmt_id = am.legacy_int_id
          LEFT JOIN migration._id_map_mdcd_demo dm   ON dm.new_uuid = h.demo_uuid
          LEFT JOIN mysql_raw.mdcd_demo pd           ON pd.mdcd_demo_id = dm.legacy_int_id
         ORDER BY s.mdcd_demo_amndmt_id
        """,
    ):
        rows.append({
            "amndmt_id": amndmt_id,
            "name": name,
            "disposition": "held_back_parent",
            "parent_medicaid_id": parent_mid,
            "reason": reason,
        })

    # Valid (minted in id map) but dropped at the resolved view -> soft-deleted.
    for amndmt_id, name in _rows(
        conn,
        """
        SELECT s.mdcd_demo_amndmt_id, s.mdcd_demo_amndmt_name
          FROM stg._valid_amndmt_ids v
          JOIN mysql_raw.mdcd_demo_amndmt s          ON s.mdcd_demo_amndmt_id = v.amndmt_id
          JOIN migration._id_map_mdcd_demo_amndmt m  ON m.legacy_int_id = v.amndmt_id
          LEFT JOIN stg.amendment_resolved r         ON r.new_uuid = m.new_uuid
         WHERE r.new_uuid IS NULL
         ORDER BY s.mdcd_demo_amndmt_id
        """,
    ):
        rows.append({
            "amndmt_id": amndmt_id,
            "name": name,
            "disposition": "excluded_soft_delete",
            "reason": "soft-deleted (dltd_ind=1); excluded at stg.amendment_resolved",
        })

    # In source but never PMDA-valid -> filtered by stg._valid_amndmt_ids.
    for amndmt_id, name, reason in _rows(
        conn,
        """
        SELECT s.mdcd_demo_amndmt_id, s.mdcd_demo_amndmt_name,
               CASE
                 WHEN s.creatd_dt IS NULL
                   OR (s.amndmt_aplctn_dt IS NOT NULL
                       AND (extract(year FROM s.amndmt_aplctn_dt) < 1990
                         OR extract(year FROM s.amndmt_aplctn_dt) > 2099))
                 THEN 'invalid creatd_dt/amndmt_aplctn_dt; fails the date rule in stg._valid_amndmt_ids'
                 ELSE 'neither approved nor pending parent survives its filter (stg._valid_amndmt_ids)'
               END
          FROM mysql_raw.mdcd_demo_amndmt s
          LEFT JOIN stg._valid_amndmt_ids v ON v.amndmt_id = s.mdcd_demo_amndmt_id
         WHERE v.amndmt_id IS NULL
         ORDER BY s.mdcd_demo_amndmt_id
        """,
    ):
        rows.append({
            "amndmt_id": amndmt_id,
            "name": name,
            "disposition": "filtered_invalid",
            "reason": reason,
        })

    rows.sort(key=lambda r: (_AMENDMENT_DISPOSITION_ORDER[r["disposition"]], r["amndmt_id"]))

    stage_counts = {
        "mysql_raw.mdcd_demo_amndmt": _scalar(
            conn, "SELECT count(*) FROM mysql_raw.mdcd_demo_amndmt"
        ),
        "stg._valid_amndmt_ids": _scalar(conn, "SELECT count(*) FROM stg._valid_amndmt_ids"),
        "migration._id_map_mdcd_demo_amndmt": _scalar(
            conn, "SELECT count(*) FROM migration._id_map_mdcd_demo_amndmt"
        ),
        "stg.amendment_resolved": _scalar(conn, "SELECT count(*) FROM stg.amendment_resolved"),
        "demos_app.application (Amendment)": _scalar(
            conn,
            "SELECT count(*) FROM demos_app.application WHERE application_type_id = 'Amendment'",
        ),
        "demos_app.amendment": _scalar(conn, "SELECT count(*) FROM demos_app.amendment"),
        "migration._parity_amendment_held": _view_count(
            conn, "migration._parity_amendment_held"
        ),
        "migration._parity_amendment_signature_dropped": _view_count(
            conn, "migration._parity_amendment_signature_dropped"
        ),
        "migration._parity_amendment_phase_derived": _view_count(
            conn, "migration._parity_amendment_phase_derived"
        ),
    }

    return {
        "table": "amendment",
        "source_anchor": "mysql_raw.mdcd_demo_amndmt",
        "generated_by": "docs/tools/table_flow_trace.py --table amendment",
        "fixture": "tests/sql/fixtures/amendment_flow/seed_mdcd_demo_amndmt.sql",
        "stage_counts": stage_counts,
        "rows": rows,
    }


_AMENDMENT_STAGE_LABELS = {
    "mysql_raw.mdcd_demo_amndmt": "`mysql_raw.mdcd_demo_amndmt` (source rows seeded by the fixture)",
    "stg._valid_amndmt_ids": "`stg._valid_amndmt_ids` (passed the date + parent-survival filter)",
    "migration._id_map_mdcd_demo_amndmt":
        "`migration._id_map_mdcd_demo_amndmt` (UUID minted per valid id)",
    "stg.amendment_resolved": "`stg.amendment_resolved` (projected; soft-deletes dropped)",
    "demos_app.application (Amendment)": "`demos_app.application` (the IS-A anchor row)",
    "demos_app.amendment": "`demos_app.amendment` (loaded)",
    "migration._parity_amendment_held":
        "parity 19: `_parity_amendment_held` (parent demonstration not loaded)",
    "migration._parity_amendment_signature_dropped":
        "parity 19: `_parity_amendment_signature_dropped` (OGD/DD signature -> NULL)",
    "migration._parity_amendment_phase_derived":
        "parity 19: `_parity_amendment_phase_derived` (status -> phase tally; rows = phases)",
}

_AMENDMENT_DISPOSITION_LABELS = {
    "loaded": "loaded",
    "held_back_parent": "held back (parent demonstration not loaded)",
    "excluded_soft_delete": "excluded (soft-deleted)",
    "filtered_invalid": "filtered (bad dates or no surviving parent)",
}


def _render_amendment_trace(manifest: dict[str, Any]) -> str:
    out: list[str] = [
        "// Generated by docs/tools/table_flow_trace.py --table amendment.",
        "// Do not edit by hand; rerun `make amendment-flow-trace`.",
        "// Minted UUIDs are normalized to stable AMENDMENT_UUID_NN tokens",
        "// (ordered by mdcd_demo_amndmt_id), so re-running on the same fixture",
        "// yields a byte-identical trace.",
        "",
        ".Stage row counts (curated fixture)",
        "[%header%autowidth]",
        "|===",
        "| Stage | Rows",
        "",
    ]
    for key, label in _AMENDMENT_STAGE_LABELS.items():
        value = manifest["stage_counts"].get(key)
        out.append(f"| {label} | {'—' if value is None else value}")
    out += [
        "|===",
        "",
        ".Per-amendment disposition (UUIDs normalized to tokens)",
        "[%header%autowidth]",
        "|===",
        "| amndmt_id | name | UUID | Disposition | parent demonstration | status_id "
        "| current_phase_id | signature_level_id | Reason",
        "",
    ]
    for row in manifest["rows"]:
        out.append(
            "| `{aid}` | {name} | {tok} | {disp} | {parent} | {st} | {ph} | {sig} | {why}".format(
                aid=_esc(row.get("amndmt_id")),
                name=_esc(row.get("name")),
                tok=row.get("uuid_token", "—"),
                disp=_AMENDMENT_DISPOSITION_LABELS[row["disposition"]],
                parent=_esc(row.get("parent_medicaid_id")),
                st=_esc(row.get("status_id")),
                ph=_esc(row.get("current_phase_id")),
                sig=_esc(row.get("signature_level_id")),
                why=_esc(row.get("reason")),
            )
        )
    out += ["|===", ""]
    return "\n".join(out)


@dataclass(frozen=True)
class FlowSpec:
    table: str
    seed_path: Path
    manifest_path: Path
    trace_path: Path
    loaded_stage_key: str
    build_manifest: Callable[[Any], dict[str, Any]]
    render_trace: Callable[[dict[str, Any]], str]


SPECS: dict[str, FlowSpec] = {
    "demonstration": FlowSpec(
        table="demonstration",
        seed_path=REPO_ROOT / "tests" / "sql" / "fixtures" / "demo_flow" / "seed_mdcd_demo.sql",
        manifest_path=REPO_ROOT
        / "tests" / "sql" / "fixtures" / "demo_flow" / "expected_manifest.json",
        trace_path=GENERATED_LIVE_DIR / "demonstration-flow-trace.adoc",
        loaded_stage_key="demos_app.demonstration",
        build_manifest=_demonstration_manifest,
        render_trace=_render_demonstration_trace,
    ),
    "amendment": FlowSpec(
        table="amendment",
        seed_path=REPO_ROOT
        / "tests" / "sql" / "fixtures" / "amendment_flow" / "seed_mdcd_demo_amndmt.sql",
        manifest_path=REPO_ROOT
        / "tests" / "sql" / "fixtures" / "amendment_flow" / "expected_manifest.json",
        trace_path=GENERATED_LIVE_DIR / "amendment-flow-trace.adoc",
        loaded_stage_key="demos_app.amendment",
        build_manifest=_amendment_manifest,
        render_trace=_render_amendment_trace,
    ),
}


def run_pipeline(conn: Any, spec: FlowSpec) -> dict[str, Any]:
    """Stand up, seed, and build the full flow on ``conn``; return the manifest."""
    _standup(conn)
    _build_source(conn, spec.seed_path)
    _run_crosswalks(conn)
    _run_build(conn)
    return spec.build_manifest(conn)


def _resolve_dsn(explicit: str | None) -> str:
    import os

    if explicit:
        return explicit
    env = os.environ.get("PG_TEST_DSN")
    if env:
        return env
    print(
        "[table_flow_trace] PG_TEST_DSN unset; resolving via scripts/ensure_test_db.sh",
        file=sys.stderr,
    )
    result = subprocess.run(
        ["sh", str(ENSURE_TEST_DB)], capture_output=True, text=True, cwd=str(REPO_ROOT)
    )
    sys.stderr.write(result.stderr)
    dsn = result.stdout.strip()
    if result.returncode != 0 or not dsn:
        raise SystemExit(
            "[table_flow_trace] could not resolve a harness DSN. Start Docker and retry, "
            "or export PG_TEST_DSN / pass --dsn."
        )
    return dsn


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    p.add_argument("--table", default="demonstration", choices=sorted(SPECS))
    p.add_argument("--dsn", default=None, help="Postgres DSN (default: PG_TEST_DSN or harness)")
    p.add_argument(
        "--check",
        action="store_true",
        help="run the pipeline and compare against the committed manifest without writing",
    )
    args = p.parse_args(argv)
    spec = SPECS[args.table]

    import psycopg

    dsn = _resolve_dsn(args.dsn)
    try:
        conn = psycopg.connect(dsn, autocommit=True)
    except psycopg.Error as e:
        raise SystemExit(f"[table_flow_trace] cannot connect to {dsn}: {e}") from e
    try:
        try:
            conn.execute("CREATE EXTENSION IF NOT EXISTS pg_jsonschema")
        except psycopg.Error as e:
            raise SystemExit(
                f"[table_flow_trace] pg_jsonschema unavailable on {dsn}: {e}. "
                "Use a supabase/postgres harness (make test-db-up)."
            ) from e
        manifest = run_pipeline(conn, spec)
    finally:
        conn.close()

    trace = spec.render_trace(manifest)
    manifest_text = json.dumps(manifest, indent=2, sort_keys=False) + "\n"

    if args.check:
        committed = (
            spec.manifest_path.read_text(encoding="utf-8")
            if spec.manifest_path.exists()
            else ""
        )
        if committed != manifest_text:
            print(
                f"[table_flow_trace] STALE: {spec.manifest_path.relative_to(REPO_ROOT)} "
                "does not match a fresh run; rerun the Make target.",
                file=sys.stderr,
            )
            return 1
        print("[table_flow_trace] manifest is fresh.")
        return 0

    spec.trace_path.parent.mkdir(parents=True, exist_ok=True)
    spec.manifest_path.parent.mkdir(parents=True, exist_ok=True)
    spec.trace_path.write_text(trace, encoding="utf-8")
    spec.manifest_path.write_text(manifest_text, encoding="utf-8")
    print(
        f"[table_flow_trace] wrote {spec.trace_path.relative_to(REPO_ROOT)} and "
        f"{spec.manifest_path.relative_to(REPO_ROOT)} "
        f"({manifest['stage_counts'][spec.loaded_stage_key]} loaded)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
