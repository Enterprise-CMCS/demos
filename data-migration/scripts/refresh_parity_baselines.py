#!/usr/bin/env python3
"""Refresh (and optionally sign) the SME accepted-flags baselines under ``reports/parity_accepted/``.

Three parity gates reconcile a live "held flag" set against a committed,
SME-signed baseline CSV: check 4 (pending/approved deferrals), check 10
(person_state XX grants) and check 12 (dropped demonstration role assignments).
``_classify_held_flags`` in ``migration/phases/parity.py`` only gates the
``live - baseline`` direction, because a baseline row that no longer occurs
cannot make the migration wrong. The consequence is that the opposite direction
drifts silently: a baseline can accumulate rows the pipeline stopped producing
and the gate still goes GREEN. That is how
``pending_approved_deferrals.csv`` came to describe 22 deferred pending
demonstrations when the pipeline produced 1 -- the other 21 had been
soft-deleted in the source and dropped by ``stg._pendg_demo_fold``.

Signing a baseline is an SME asserting "I reviewed these exact rows", so the
rows have to be the rows. This script rewrites each baseline's data section from
its live view, preserves the ``#`` documentation header verbatim, and reports
what it added and removed so the diff is reviewable before signing.

Run from the repo root::

    uv run python scripts/refresh_parity_baselines.py                  # report only
    uv run python scripts/refresh_parity_baselines.py --write
    uv run python scripts/refresh_parity_baselines.py --write \\
        --sign --reviewer "Jane Doe" --date 2026-08-01

``--sign`` sets ``# Status: SIGNED`` with the given reviewer and date; without
it the existing Status/Reviewer/Date lines are preserved, so a refresh does not
silently re-sign a baseline whose contents changed.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
from dataclasses import dataclass
from datetime import date as _date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from migration.lib import Env, log, psql_query, rel

PARITY_ACCEPTED_DIR = Path(__file__).resolve().parents[1] / "reports" / "parity_accepted"


@dataclass(frozen=True)
class Baseline:
    """One accepted-flags baseline: its file, its live source, and its key."""

    filename: str
    gate: str
    # The live query must return the baseline's data columns in file order.
    query: str
    columns: tuple[str, ...]
    # Key columns parity.py compares on; a subset of ``columns``.
    key_columns: tuple[str, ...]


BASELINES = (
    Baseline(
        filename="pending_approved_deferrals.csv",
        gate="4",
        query=(
            "SELECT legacy_pendg_demo_id, reason, coalesce(medicaid_id, '') "
            "FROM migration._parity_pending_approved "
            "WHERE category = 'pending_only_deferred' "
            "ORDER BY legacy_pendg_demo_id"
        ),
        columns=("legacy_pendg_demo_id", "reason", "medicaid_id"),
        key_columns=("legacy_pendg_demo_id", "reason"),
    ),
    Baseline(
        filename="person_state_flags.csv",
        gate="10",
        query=(
            "SELECT user_id, state_cd, reason FROM migration._parity_person_state_flags "
            "ORDER BY user_id, state_cd, reason"
        ),
        columns=("user_id", "state_cd", "reason"),
        key_columns=("user_id", "state_cd", "reason"),
    ),
    Baseline(
        filename="demonstration_role_assignment_flags.csv",
        gate="12",
        query=(
            "SELECT legacy_user_id, legacy_demonstration_id, role_id, person_type_id, reason "
            "FROM migration._parity_demonstration_role_assignment_flags "
            "ORDER BY legacy_user_id, legacy_demonstration_id, role_id, person_type_id, reason"
        ),
        columns=(
            "legacy_user_id",
            "legacy_demonstration_id",
            "role_id",
            "person_type_id",
            "reason",
        ),
        key_columns=(
            "legacy_user_id",
            "legacy_demonstration_id",
            "role_id",
            "person_type_id",
            "reason",
        ),
    ),
)


def _split(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    """Return the ``#`` header lines and the parsed data rows of a baseline."""
    header: list[str] = []
    data: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        (header if raw.lstrip().startswith("#") else data).append(raw)
    return header, list(csv.DictReader(data))


def _keys(rows: list[dict[str, str]], key_columns: tuple[str, ...]) -> set[tuple[str, ...]]:
    """Project rows onto the gate's comparison key, matching parity.py's trimming."""
    return {tuple((r.get(c) or "").strip() for c in key_columns) for r in rows}


def _sign_header(header: list[str], reviewer: str, when: str) -> list[str]:
    """Return ``header`` with Status/Reviewer/Date set to a signed triple."""
    out: list[str] = []
    replaced = {"status": False, "reviewer": False, "date": False}
    for line in header:
        body = line.lstrip("# ").strip().lower()
        if body.startswith("status:"):
            out.append("# Status: SIGNED")
            replaced["status"] = True
        elif body.startswith("reviewer:"):
            out.append(f"# Reviewer: {reviewer}")
            replaced["reviewer"] = True
        elif body.startswith("date:"):
            out.append(f"# Date: {when}")
            replaced["date"] = True
        else:
            out.append(line)
    if not replaced["status"]:
        out.append("# Status: SIGNED")
    if not replaced["reviewer"]:
        out.append(f"# Reviewer: {reviewer}")
    if not replaced["date"]:
        out.append(f"# Date: {when}")
    return out


def _render(header: list[str], columns: tuple[str, ...], rows: list[tuple[str, ...]]) -> str:
    """Render a baseline file: header comments, then a normal CSV."""
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(columns)
    writer.writerows(rows)
    return "\n".join(header) + "\n" + buf.getvalue()


NOTE_COLUMN = "note"


def _carry_forward_notes(
    old_rows: list[dict[str, str]], key_columns: tuple[str, ...]
) -> dict[tuple[str, ...], str]:
    """Map each previously annotated row key to its ``note``.

    An SME may annotate individual baseline rows to record *why* a particular
    flag is acceptable (the region-10 rescue drops, for instance). Regenerating
    the data section from the live view would otherwise erase those notes, which
    is the opposite of what a reviewable baseline should do, so they are keyed by
    the gate's own comparison key and re-attached.
    """
    notes: dict[tuple[str, ...], str] = {}
    for row in old_rows:
        note = (row.get(NOTE_COLUMN) or "").strip()
        if note:
            notes[tuple((row.get(c) or "").strip() for c in key_columns)] = note
    return notes


def refresh(env: Env, spec: Baseline, *, write: bool, sign: tuple[str, str] | None) -> int:
    """Refresh one baseline; return the number of rows that differ from the file."""
    path = PARITY_ACCEPTED_DIR / spec.filename
    if not path.exists():
        log(f"gate {spec.gate}: {rel(path)} missing; skipping")
        return 0
    header, old_rows = _split(path)
    live = [
        tuple("" if v is None else str(v).strip() for v in r) for r in psql_query(env, spec.query)
    ]
    live_dicts = [dict(zip(spec.columns, r, strict=True)) for r in live]
    added = _keys(live_dicts, spec.key_columns) - _keys(old_rows, spec.key_columns)
    removed = _keys(old_rows, spec.key_columns) - _keys(live_dicts, spec.key_columns)
    log(
        f"gate {spec.gate} {spec.filename}: file={len(old_rows)} live={len(live)} "
        f"+{len(added)} new, -{len(removed)} stale"
    )
    for k in sorted(added):
        log(f"    + {','.join(k)}")
    for k in sorted(removed):
        log(f"    - {','.join(k)} (no longer produced by the pipeline)")
    if write:
        out_header = _sign_header(header, *sign) if sign else header
        columns: tuple[str, ...] = spec.columns
        rows: list[tuple[str, ...]] = list(live)
        notes = _carry_forward_notes(old_rows, spec.key_columns)
        if notes:
            columns = (*spec.columns, NOTE_COLUMN)
            rows = [
                (*r, notes.get(tuple(d[c] for c in spec.key_columns), ""))
                for r, d in zip(live, live_dicts, strict=True)
            ]
            kept = sum(1 for r in rows if r[-1])
            log(f"    carried forward {kept}/{len(notes)} row note(s)")
        path.write_text(_render(out_header, columns, rows), encoding="utf-8")
        log(f"    wrote {rel(path)}" + (" (SIGNED)" if sign else ""))
    return len(added) + len(removed)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="rewrite the baseline files")
    parser.add_argument("--sign", action="store_true", help="set Status: SIGNED (implies --write)")
    parser.add_argument("--reviewer", default="", help="reviewer name recorded in the signature")
    parser.add_argument("--date", default=_date.today().isoformat(), help="ISO sign-off date")
    parser.add_argument("--only", default="", help="refresh just this baseline filename")
    args = parser.parse_args(argv)
    if args.sign and not args.reviewer:
        parser.error("--sign requires --reviewer")
    env = Env.load()
    specs = [b for b in BASELINES if not args.only or b.filename == args.only]
    if not specs:
        parser.error(f"no baseline matches --only {args.only!r}")
    drift = 0
    for spec in specs:
        drift += refresh(
            env,
            spec,
            write=args.write or args.sign,
            sign=(args.reviewer, args.date) if args.sign else None,
        )
    if not (args.write or args.sign):
        log(f"report only ({drift} row(s) differ); pass --write to apply")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
