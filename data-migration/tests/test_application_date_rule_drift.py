"""Guard: the seeded application-date rules must match the DEMOS server source.

``sql/02_seeds_static/36_application_date_rule.sql`` transcribes
``DATE_TYPES_WITH_EXPECTED_TIMESTAMPS`` (``server/src/constants.ts``) and the
``VALIDATION_CHECKS`` mutations in
``server/src/model/applicationDate/validateInputDates.ts`` into SQL, so the
date-consistency parity view (``sql/99_parity/60_application_date_consistency.sql``)
can report which loaded rows would fail DEMOS's own validation.

Same reasoning as ``test_phase_completion_rule_drift.py``: a transcription that
silently goes stale would under-report while still looking authoritative, so it
is re-derived from the TypeScript on every run.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TS_VALIDATE = REPO_ROOT / "server/src/model/applicationDate/validateInputDates.ts"
TS_CONSTANTS = REPO_ROOT / "server/src/constants.ts"
SEED_SQL = (
    Path(__file__).resolve().parents[1] / "sql/02_seeds_static/36_application_date_rule.sql"
)


def _seed_text() -> str:
    text = SEED_SQL.read_text(encoding="utf-8")
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"--[^\n]*", "", text)


def _ts_expected_timestamps() -> dict[str, str]:
    text = TS_CONSTANTS.read_text(encoding="utf-8")
    m = re.search(
        r"export const DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[^=]*=\s*\{(.*?)\n\} as const;",
        text,
        re.S,
    )
    assert m, "DATE_TYPES_WITH_EXPECTED_TIMESTAMPS not found"
    return {
        k: v
        for k, v in re.findall(
            r'"([^"]+)":\s*\{\s*expectedTimestamp:\s*"([^"]+)"\s*\}', m.group(1)
        )
    }


def _seed_expected_timestamps() -> dict[str, str]:
    text = _seed_text()
    m = re.search(
        r"INSERT INTO migration\.date_type_expected_timestamp.*?VALUES(.*?);", text, re.S
    )
    assert m, "expected-timestamp INSERT not found in seed"
    return {
        a.replace("''", "'"): b
        for a, b in re.findall(r"\(\s*'((?:[^']|'')*)'\s*,\s*'([^']*)'\s*\)", m.group(1))
    }


def _ts_rules() -> set[tuple[str, str, str, int | None, str | None]]:
    """Parse the VALIDATION_CHECKS[...] push() mutations into rule tuples."""
    text = TS_VALIDATE.read_text(encoding="utf-8")
    rules: set[tuple[str, str, str, int | None, str | None]] = set()

    for m in re.finditer(
        r'VALIDATION_CHECKS\["([^"]+)"\]\["greaterThanOrEqualChecks"\]\.push\(\{\s*'
        r'dateTypeToCheck:\s*"([^"]+)"',
        text,
    ):
        rules.add((m.group(1), "gte", m.group(2), None, None))

    for m in re.finditer(
        r'VALIDATION_CHECKS\["([^"]+)"\]\["offsetChecks"\]\.push\(\{\s*'
        r'dateTypeToCheck:\s*"([^"]+)",\s*dateOffset:\s*\{\s*'
        r'days:\s*(-?\d+),\s*expectedTimestamp:\s*"([^"]+)"',
        text,
    ):
        rules.add((m.group(1), "offset", m.group(2), int(m.group(3)), m.group(4)))

    # greaterThanChecks exist in the framework but are unused today; if the
    # server starts using them the seed needs a new rule_kind, so fail loudly.
    assert not re.search(
        r'VALIDATION_CHECKS\["[^"]+"\]\["greaterThanChecks"\]\.push', text
    ), "server now uses greaterThanChecks; seed needs a 'gt' rule_kind"

    return rules


def _seed_rules() -> set[tuple[str, str, str, int | None, str | None]]:
    text = _seed_text()
    m = re.search(r"INSERT INTO migration\.application_date_rule.*?VALUES(.*?);", text, re.S)
    assert m, "rule INSERT not found in seed"
    rules: set[tuple[str, str, str, int | None, str | None]] = set()
    for row in re.findall(
        r"\(\s*'((?:[^']|'')*)'\s*,\s*'(\w+)'\s*,\s*'((?:[^']|'')*)'\s*,\s*"
        r"(NULL|-?\d+)\s*,\s*(NULL|'[^']*')\s*\)",
        m.group(1),
    ):
        date_type, kind, target, days, ts = row
        rules.add(
            (
                date_type.replace("''", "'"),
                kind,
                target.replace("''", "'"),
                None if days == "NULL" else int(days),
                None if ts == "NULL" else ts.strip("'"),
            )
        )
    return rules


def test_parsers_are_not_vacuous() -> None:
    """Guard the guard: a regex that matched nothing would pass every test below."""
    assert len(_ts_expected_timestamps()) == 42
    assert len(_ts_rules()) == 14
    assert len(_seed_expected_timestamps()) == 42
    assert len(_seed_rules()) == 14


def test_expected_timestamps_match_server() -> None:
    """Every date type's Start/End-of-Day expectation matches constants.ts."""
    ts = _ts_expected_timestamps()
    seeded = _seed_expected_timestamps()
    assert seeded == ts, {
        "missing_from_seed": sorted(set(ts) - set(seeded)),
        "extra_in_seed": sorted(set(seeded) - set(ts)),
        "value_drift": sorted(k for k in set(ts) & set(seeded) if ts[k] != seeded[k]),
    }


def test_end_of_day_types_are_exactly_the_five_known() -> None:
    """Pin the End-of-Day set explicitly; a silent flip inverts the parity view."""
    ts = _ts_expected_timestamps()
    assert sorted(k for k, v in ts.items() if v == "End of Day") == [
        "CMS (OSORA) Clearance End",
        "Completeness Review Due Date",
        "Federal Comment Period End Date",
        "OSORA R1 Comments Due",
        "OSORA R2 Comments Due",
    ]


def test_ordering_and_offset_rules_match_server() -> None:
    """Every gte/offset rule matches validateInputDates.ts, in both directions."""
    ts = _ts_rules()
    seeded = _seed_rules()
    assert seeded == ts, {
        "missing_from_seed": sorted(ts - seeded),
        "extra_in_seed": sorted(seeded - ts),
    }


def test_offset_rules_are_seeded_in_both_directions() -> None:
    """Each offset pair is declared both ways in the server; the seed must match.

    If only one direction were seeded the view would under-report by roughly
    half, and the omission would be invisible in the output.
    """
    offsets = {(a, t, d) for a, k, t, d, _ in _seed_rules() if k == "offset"}
    for a, t, d in sorted(offsets):
        assert d is not None
        assert (t, a, -d) in offsets, f"missing reverse of {a} = {t} {d:+d} days"
