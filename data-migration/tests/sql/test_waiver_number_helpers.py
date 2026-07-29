"""Live-PG unit tests for the waiver-number normalizers in ``03_helper_fns.sql``.

``migration.normalize_waiver_number`` is the single place the migration decides
whether a legacy string is a usable waiver id, and every consumer -- the two demo
filters, the pending fold, the duplicate-winner logic, the SME filter report --
depends on it agreeing with itself. It is also the place two source realities are
absorbed:

* PMDA writes CMS region 10 two ways, ``/10`` and a bare trailing ``/0``. Every
  ``/0`` row in the live source is an AK/ID/OR/WA demonstration, which is exactly
  region 10, so the bare form is a truncation, not a distinct region. Dropping it
  silently loses 41 demonstrations; the repo's own duplicate-winner branch already
  assumed ``0`` meant region 10 but could never fire because normalization rejected
  the row first.
* ``11W000000`` is a placeholder, not an issued waiver, and must not be rescued
  into a well-formed id.

The cases below are drawn from the live distribution, and the region-10 and
placeholder cases are the ones a future refactor is most likely to "clean up".
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    import psycopg

ROOT = Path(__file__).resolve().parents[2]
HELPERS = ROOT / "sql" / "00_init" / "03_helper_fns.sql"


def _apply_helpers(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS migration CASCADE")
    conn.execute("CREATE SCHEMA migration")
    conn.execute(HELPERS.read_text(encoding="utf-8"))


def _scalar(conn: Any, sql: str, *args: Any) -> Any:
    row = conn.execute(sql, args).fetchone()
    assert row is not None
    return row[0]


_MEDICAID = [
    # (raw, normalized or None)
    ("11-W-00299/4", "11-W-00299/4"),
    ("  11-W-00299/4  ", "11-W-00299/4"),
    ("11W002994", "11-W-00299/4"),
    ("11-W-00300-8", "11-W-00300/8"),
    ("11 -W-00326/6", "11-W-00326/6"),
    ("11-W- 0000- 5/4", "11-W-00005/4"),
    ("11-w-00299/4", "11-W-00299/4"),  # lowercase 'w' (hardening; none live today)
    ("11-W-00254/10", "11-W-00254/10"),
    ("11-W-001514", "11-W-00151/4"),  # 6-digit run splits 5 project + 1 region
    # Region 10 written as a bare trailing 0 (AK/ID/OR/WA in the live source).
    ("11-W-00318/0", "11-W-00318/10"),
    ("11W003180", "11-W-00318/10"),
    # Not rescuable.
    ("11W000000", None),  # all-zeros placeholder
    ("11-W-00000/0", None),
    ("21-W-00071/5", None),  # CHIP id, wrong prefix for the Medicaid column
    ("11-W-00318/11", None),  # no CMS region 11
    ("11-W-0015140", None),  # 7-digit run with a trailing 0 is not region 10
    ("LA-0001", None),
    ("None", None),
    ("", None),
    (None, None),
]

_CHIP = [
    ("21-W-00071/5", "21-W-00071/5"),
    ("21W000715", "21-W-00071/5"),
    ("21-W-00062/0", "21-W-00062/10"),
    ("11-W-00299/4", None),  # Medicaid id misfiled in the CHIP column
    ("11-W-001514", None),  # ditto, in the shape the live CHIP column carries
    ("None", None),  # the literal string the source stores for "no CHIP id"
    (None, None),
]


@pytest.mark.parametrize(("raw", "expected"), _MEDICAID)
def test_normalize_medicaid_id(pg_db: psycopg.Connection, raw: str | None, expected: str | None) -> None:
    _apply_helpers(pg_db)
    assert _scalar(pg_db, "SELECT migration.normalize_medicaid_id(%s)", raw) == expected


@pytest.mark.parametrize(("raw", "expected"), _CHIP)
def test_normalize_chip_id(pg_db: psycopg.Connection, raw: str | None, expected: str | None) -> None:
    """The CHIP column takes 21-W ids only; a Medicaid id filed there is not CHIP."""
    _apply_helpers(pg_db)
    assert _scalar(pg_db, "SELECT migration.normalize_chip_id(%s)", raw) == expected


def test_prefixes_do_not_cross(pg_db: psycopg.Connection) -> None:
    """Neither normalizer may accept the other's prefix, in any spelling."""
    _apply_helpers(pg_db)
    for raw in ("21-W-00071/5", "21W000715", "21 -W- 00071/5"):
        assert _scalar(pg_db, "SELECT migration.normalize_medicaid_id(%s)", raw) is None
    for raw in ("11-W-00299/4", "11W002994", "11 -W- 00299/4"):
        assert _scalar(pg_db, "SELECT migration.normalize_chip_id(%s)", raw) is None


def test_normalization_is_idempotent(pg_db: psycopg.Connection) -> None:
    """Normalizing an already-normalized id must be a no-op for every rescued case.

    The fold key and the duplicate-winner logic normalize values that may already
    be canonical, so a second pass must not shift them (notably the region-10
    rescue must not re-append another 0).
    """
    _apply_helpers(pg_db)
    for raw, expected in _MEDICAID:
        if expected is None:
            continue
        once = _scalar(pg_db, "SELECT migration.normalize_medicaid_id(%s)", raw)
        twice = _scalar(pg_db, "SELECT migration.normalize_medicaid_id(%s)", once)
        assert twice == once == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("11-W-00289/7", "00289"),
        ("11W002895", "00289"),
        ("11-W-00318/0", "00318"),
        ("21-W-00071/5", None),  # not a Medicaid id
        ("garbage", None),
        (None, None),
    ],
)
def test_medicaid_project_number(
    pg_db: psycopg.Connection, raw: str | None, expected: str | None
) -> None:
    """The 5-digit project number is the region-independent identity of a waiver.

    It is what lets the pending fold recognize that ``11-W-00289/5`` and
    ``11-W-00289/7`` are the same Iowa demonstration with one digit mistyped.
    """
    _apply_helpers(pg_db)
    assert _scalar(pg_db, "SELECT migration.medicaid_project_number(%s)", raw) == expected


def test_region_digit_differs_only_in_region(pg_db: psycopg.Connection) -> None:
    """Two ids sharing a project number but not a region must normalize apart.

    The repair fold is allowed to merge them only after confirming the state
    matches; normalization itself must never do it.
    """
    _apply_helpers(pg_db)
    a = _scalar(pg_db, "SELECT migration.normalize_medicaid_id('11-W-00289/5')")
    b = _scalar(pg_db, "SELECT migration.normalize_medicaid_id('11-W-00289/7')")
    assert a == "11-W-00289/5"
    assert b == "11-W-00289/7"
    assert a != b
    assert _scalar(pg_db, "SELECT migration.medicaid_project_number(%s)", a) == _scalar(
        pg_db, "SELECT migration.medicaid_project_number(%s)", b
    )
