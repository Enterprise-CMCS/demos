"""Live-PG harness: the filter report must name exactly the rows the filters exclude.

``sql/10_stg/99_filter_report.sql`` is the SME-facing account of *why* a source row
did not migrate, and its front-matter has always claimed it stays "in lockstep"
with the per-anchor filters. Nothing enforced that. The two drifted: decision D17
moved ``10_filter_demo.sql`` onto ``migration.normalize_medicaid_id`` while the
report kept a hand-copied canonical regex, so the report named 18 rows as
excluded that in fact loaded, and the region-10 rescue widened the gap to 28.
The failure is silent by construction -- both files are individually valid SQL and
the pipeline is green either way -- so it can only be caught by comparing the two
sets directly, which is what this module does.

The corpus is the real shape distribution from PMDA (unseparated runs, embedded
spaces, a ``-`` for the ``/``, the bare-0 region-10 spelling, a CHIP id in the
Medicaid column, an all-zeros placeholder) rather than invented strings, so a
future "simplification" of either predicate has to stay honest about real data.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

from tests.sql._skeleton import apply_migration_helper_fns

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
STG_DIR = ROOT / "sql" / "10_stg"

# Every column 99_filter_report.sql or the two demo filters actually reference.
_TABLES = {
    "mdcd_demo": (
        "mdcd_demo_id bigint, mdcd_demo_num text, geo_ansi_state_cd text,"
        " creatd_dt timestamptz, state_prfmnc_yr_strt_dt timestamptz"
    ),
    "mdcd_pendg_demo": (
        "mdcd_pendg_demo_id bigint, mdcd_demo_num text, geo_ansi_state_cd text,"
        " creatd_dt timestamptz, state_prfmnc_yr_strt_dt timestamptz"
    ),
    "mdcd_demo_aplctn": (
        "mdcd_demo_aplctn_id bigint, creatd_dt timestamptz,"
        " mdcd_demo_aplctn_stus_dt timestamptz"
    ),
    "mdcd_demo_cntct": (
        "mdcd_demo_id bigint, state_mdcd_drctr_email_adr text,"
        " ro_fincl_lead_email_adr text, sota_email_adr text, ro_state_lead_email_adr text"
    ),
    "mdcd_pendg_demo_cntct": "mdcd_pendg_demo_id bigint, state_mdcd_drctr_email_adr text",
    "users": "id bigint, username text, email text",
}

# (mdcd_demo_num, state, expect_kept). Kept == the row survives the project-number
# rule, i.e. migration.normalize_medicaid_id rescues it.
_PROJECT_NUMBERS = [
    ("11-W-00299/4", "AL", True),  # already canonical
    ("11W002994", "AL", True),  # unseparated run
    ("11-W-00300-8", "MT", True),  # '-' where the '/' belongs
    ("11 -W-00326/6", "TX", True),  # space inside the prefix
    ("11-W-00369/4 ", "TN", True),  # trailing space
    ("11-W- 0000- 5/4", "KY", True),  # spaces and an extra '-'
    ("11-W-00254/10", "WA", True),  # region 10 spelled in full
    ("11-W-00318/0", "AK", True),  # region 10 as a bare trailing 0
    ("11-W-00345/0", "WA", True),
    ("11W000000", "NY", False),  # all-zeros placeholder, not an issued waiver
    ("21-W-00071/5", "WA", False),  # CHIP id in the Medicaid column
    ("11-W-00318/11", "AK", False),  # region 11 does not exist
    ("LA-0001", "LA", False),
    ("abc123", "CA", False),
    ("12456", "CA", False),
    (None, "CA", False),  # required on the approved anchor
]


def _provision(conn: Any) -> None:
    """Build the minimal mysql_raw surface, the helpers, and the three views."""
    conn.execute("DROP SCHEMA IF EXISTS stg, mysql_raw, migration CASCADE")
    for schema in ("stg", "mysql_raw", "migration"):
        conn.execute(f"CREATE SCHEMA {schema}")
    apply_migration_helper_fns(conn)
    for table, cols in _TABLES.items():
        conn.execute(f"CREATE TABLE mysql_raw.{table} ({cols})")
    for name in ("00_keep_drop_ids", "10_filter_demo", "11_filter_pendg_demo", "99_filter_report"):
        conn.execute((STG_DIR / f"{name}.sql").read_text(encoding="utf-8"))


def _load_corpus(conn: Any) -> None:
    """Insert the project-number corpus into both demo anchors under the same ids."""
    for i, (num, state, _) in enumerate(_PROJECT_NUMBERS, start=1):
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_demo "
            "(mdcd_demo_id, mdcd_demo_num, geo_ansi_state_cd, creatd_dt) VALUES (%s, %s, %s, now())",
            (i, num, state),
        )
        conn.execute(
            "INSERT INTO mysql_raw.mdcd_pendg_demo "
            "(mdcd_pendg_demo_id, mdcd_demo_num, geo_ansi_state_cd, creatd_dt) "
            "VALUES (%s, %s, %s, now())",
            (i, num, state),
        )


def _excluded(conn: Any, table: str, pk: str, view: str) -> set[int]:
    return {
        r[0]
        for r in conn.execute(
            f"SELECT {pk} FROM mysql_raw.{table} EXCEPT SELECT demo_id FROM {view}"
        ).fetchall()
    }


def _reported(conn: Any, entity: str) -> set[int]:
    return {
        r[0]
        for r in conn.execute(
            "SELECT DISTINCT legacy_id FROM stg._filter_violations WHERE entity = %s",
            (entity,),
        ).fetchall()
    }


@pytest.mark.parametrize(
    ("entity", "pk", "view"),
    [
        ("mdcd_demo", "mdcd_demo_id", "stg._valid_demo_ids"),
        ("mdcd_pendg_demo", "mdcd_pendg_demo_id", "stg._valid_pendg_demo_ids"),
    ],
)
def test_report_names_exactly_the_excluded_rows(
    pg_db: psycopg.Connection, entity: str, pk: str, view: str
) -> None:
    """With no overrides in play the two sets must be identical, both directions."""
    _provision(pg_db)
    _load_corpus(pg_db)

    excluded = _excluded(pg_db, entity, pk, view)
    reported = _reported(pg_db, entity)

    assert reported - excluded == set(), (
        f"{entity}: report names rows as excluded that the filter actually keeps "
        f"(ids {sorted(reported - excluded)}); the report's predicate is stricter "
        "than the filter's -- call migration.normalize_medicaid_id, do not restate it"
    )
    assert excluded - reported == set(), (
        f"{entity}: filter excludes rows the report never mentions "
        f"(ids {sorted(excluded - reported)}); an SME cannot see why they were dropped"
    )


def test_project_number_rescues_match_the_corpus(pg_db: psycopg.Connection) -> None:
    """The approved anchor keeps exactly the rescuable numbers, including region 10."""
    _provision(pg_db)
    _load_corpus(pg_db)

    kept = {r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_demo_ids").fetchall()}
    for i, (num, _, expect_kept) in enumerate(_PROJECT_NUMBERS, start=1):
        assert (i in kept) is expect_kept, f"{num!r} expected kept={expect_kept}"


def test_pending_anchor_is_not_stricter_than_approved(pg_db: psycopg.Connection) -> None:
    """A number the approved anchor rescues must not be dropped by the pending anchor.

    The pending project number is *optional*, so the pending kept set is the
    approved one plus the NULL rows -- never a subset. When the two anchors
    disagree, a pending row cannot fold into its approved counterpart and instead
    mints a second demonstration for the same waiver.
    """
    _provision(pg_db)
    _load_corpus(pg_db)

    approved = {r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_demo_ids").fetchall()}
    pending = {
        r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_pendg_demo_ids").fetchall()
    }
    assert approved - pending == set(), (
        "the pending anchor drops project numbers the approved anchor rescues: "
        f"{sorted(approved - pending)}"
    )


def test_force_kept_row_is_still_reported(pg_db: psycopg.Connection) -> None:
    """A force-keep must not erase the row's violation from the SME report."""
    _provision(pg_db)
    _load_corpus(pg_db)
    bogus = next(i for i, (n, _, k) in enumerate(_PROJECT_NUMBERS, start=1) if n == "abc123" and not k)
    pg_db.execute(
        "INSERT INTO stg._keep_ids (entity, legacy_id) VALUES ('mdcd_demo', %s)", (bogus,)
    )

    kept = {r[0] for r in pg_db.execute("SELECT demo_id FROM stg._valid_demo_ids").fetchall()}
    assert bogus in kept
    assert bogus in _reported(pg_db, "mdcd_demo"), (
        "a force-kept row disappeared from the violations view; the report would "
        "then hide that an SME override is what let it through"
    )
