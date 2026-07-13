"""Static guards for the committed force-keep / force-drop override CSVs.

These run without a database (the H5 build check in
``tests/sql/test_force_keep.py`` covers the live source-existence guard).
They protect against two regressions:

1. A malformed / mis-headed override CSV, or an entity the loader does not
   know how to validate (`_OVERRIDE_SOURCE`).
2. RED-3: re-introducing the code-0 signature rehearsal deferral into
   ``drop_ids.csv``. Those 127 ``mdcd_demo`` drops were a temporary deferral
   for the approved-code-0 signature problem that RED-1 resolved for good
   (approved code-0 demos migrate as 'OA'); they must not come back as
   force-drops (and, being snapshot-specific ids, they also break H5).
"""

from __future__ import annotations

import csv

from migration.phases.build import _OVERRIDE_SOURCE, FILTER_DIR

EXPECTED_HEADER = ["entity", "legacy_id", "reason"]
# Marker of the RED-1-superseded rehearsal deferral (references the now-resolved
# SME doc). No committed override should carry it again.
RESOLVED_DEFERRAL_MARKER = "signature_level_sme_decisions"


def _rows(name: str) -> list[dict[str, str]]:
    path = FILTER_DIR / name
    with path.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        assert header == EXPECTED_HEADER, f"{name} header {header!r} != {EXPECTED_HEADER!r}"
        return [dict(zip(EXPECTED_HEADER, r, strict=True)) for r in reader if r and any(r)]


def test_override_entities_are_known() -> None:
    """Every entity in either override CSV must be validatable by the loader."""
    for name in ("keep_ids.csv", "drop_ids.csv"):
        for row in _rows(name):
            assert row["entity"] in _OVERRIDE_SOURCE, (
                f"{name}: unknown override entity {row['entity']!r}"
            )
            assert row["legacy_id"].strip().isdigit(), (
                f"{name}: non-integer legacy_id {row['legacy_id']!r}"
            )


def test_drop_ids_has_no_resolved_signature_deferral() -> None:
    """RED-3 regression: the code-0 signature deferral must not be a force-drop."""
    offending = [
        row for row in _rows("drop_ids.csv")
        if RESOLVED_DEFERRAL_MARKER in row["reason"].lower()
    ]
    assert not offending, (
        f"drop_ids.csv still lists {len(offending)} RED-1-superseded code-0 "
        "signature deferral(s); approved code-0 demos migrate as 'OA' and must "
        "not be force-dropped"
    )
