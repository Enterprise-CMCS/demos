"""Guard: the seeded phase-completion rules must match the DEMOS server source.

``sql/02_seeds_static/35_phase_completion_rule.sql`` transcribes
``server/src/model/applicationPhase/checkPhaseCompletionRules.ts`` into SQL so
the phantom-phase parity view (``sql/99_parity/61_phantom_phase.sql``) can count
migrated 'Completed' phases whose requirements are unmet.

A transcription is only as good as its freshness. The server team can add a
required date to any phase without ever touching this repo, and the parity view
would then under-report while still looking authoritative. So these tests
re-parse the TypeScript on every run and fail on any disagreement. If they fail,
the fix is to update the seed to match the server, not to loosen the test.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
TS_RULES = REPO_ROOT / "server/src/model/applicationPhase/checkPhaseCompletionRules.ts"
TS_CONSTANTS = REPO_ROOT / "server/src/constants.ts"
SEED_SQL = (
    Path(__file__).resolve().parents[1]
    / "sql/02_seeds_static/35_phase_completion_rule.sql"
)

# Rule kinds in the seed that come from the clearance-conditional constants
# rather than from a phase's own datesMustExist list.
CONDITIONAL_KINDS = {
    "date_if_osora": "CMS_OSORA_CLEARANCE_DATE_TYPES",
    "date_if_comms": "COMMS_CLEARANCE_DATE_TYPES",
}


def _string_list(block: str) -> list[str]:
    """Every double-quoted string literal in a TS array block, in order."""
    return re.findall(r'"([^"]*)"', block)


def _ts_const_list(name: str) -> list[str]:
    """Read a `export const NAME = [ ... ]` string array from constants.ts."""
    text = TS_CONSTANTS.read_text(encoding="utf-8")
    m = re.search(rf"export const {name}[^=]*=\s*\[(.*?)\]", text, re.S)
    assert m, f"{name} not found in {TS_CONSTANTS}"
    return _string_list(m.group(1))


def _parse_ts_rules() -> dict[str, dict[str, list[str]]]:
    """Parse VALIDATION_CHECKS into {phase: {kind: [requirement, ...]}}.

    'No Validation' phases parse to an empty rule dict, which is the correct
    representation: they can never be phantom.
    """
    text = TS_RULES.read_text(encoding="utf-8")
    m = re.search(
        r"const VALIDATION_CHECKS: PhaseCompletionValidationChecksRecord = \{(.*?)\n\};",
        text,
        re.S,
    )
    assert m, "VALIDATION_CHECKS block not found"
    body = m.group(1)

    rules: dict[str, dict[str, list[str]]] = {}
    # Split on top-level phase keys: `Concept: {` / `"Application Intake": {`
    # or the `"Federal Comment": "No Validation",` form.
    entry = re.compile(
        r'\n  (?:"([^"]+)"|(\w+)):\s*(?:"No Validation"|\{(.*?)\n  \})', re.S
    )
    for mm in entry.finditer(body):
        phase = mm.group(1) or mm.group(2)
        inner = mm.group(3)
        if inner is None:  # "No Validation"
            rules[phase] = {}
            continue
        phase_rules: dict[str, list[str]] = {}
        for ts_key, kind in (
            ("datesMustExist", "date"),
            ("documentTypesMustExist", "document"),
            ("phasesMustBeComplete", "phase"),
        ):
            km = re.search(rf"{ts_key}:\s*\[(.*?)\]", inner, re.S)
            if km:
                vals = _string_list(km.group(1))
            else:
                # Non-literal form, e.g. `documentTypesMustExist: APPROVAL_PACKAGE_PHASE_DOCUMENTS,`
                cm = re.search(rf"{ts_key}:\s*([A-Z_][A-Z0-9_]*)", inner)
                assert cm, f"cannot parse {ts_key} for phase {phase}"
                vals = _ts_const_list(cm.group(1))
            if vals:
                phase_rules[kind] = vals
        rules[phase] = phase_rules
    return rules


def _parse_seed() -> dict[str, dict[str, list[str]]]:
    """Parse the seeded VALUES tuples into {phase: {kind: [requirement, ...]}}."""
    text = SEED_SQL.read_text(encoding="utf-8")
    # Strip block comments so commented-out example rows can never be counted.
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"--[^\n]*", "", text)
    rows = re.findall(
        r"\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)", text
    )
    seeded: dict[str, dict[str, list[str]]] = {}
    for phase, kind, req in rows:
        seeded.setdefault(phase.replace("''", "'"), {}).setdefault(kind, []).append(
            req.replace("''", "'")
        )
    return seeded


def test_ts_source_files_exist() -> None:
    """The parse targets must exist; a moved file must fail loudly, not skip."""
    assert TS_RULES.exists(), f"missing {TS_RULES}"
    assert TS_CONSTANTS.exists(), f"missing {TS_CONSTANTS}"
    assert SEED_SQL.exists(), f"missing {SEED_SQL}"


def test_parser_finds_every_phase() -> None:
    """Sanity-check the regex parser itself before trusting its comparison.

    A parser that silently matched nothing would make the drift test below pass
    vacuously, which is the exact failure mode this whole file exists to prevent.
    """
    ts = _parse_ts_rules()
    assert len(ts) == 8, f"expected 8 phases in VALIDATION_CHECKS, got {sorted(ts)}"
    assert ts["Federal Comment"] == {}, "Federal Comment is 'No Validation'"
    # Non-literal constant reference must be resolved, not skipped.
    assert "Approval Letter" in ts["Approval Package"]["document"]
    assert len(ts["Approval Package"]["document"]) == 6


def test_seed_matches_server_unconditional_rules() -> None:
    """Every datesMustExist/documentTypesMustExist/phasesMustBeComplete matches."""
    ts = _parse_ts_rules()
    seeded = _parse_seed()

    assert set(seeded) <= set(ts), (
        f"seed has phases the server does not: {sorted(set(seeded) - set(ts))}"
    )

    for phase, kinds in ts.items():
        for kind, expected in kinds.items():
            got = sorted(seeded.get(phase, {}).get(kind, []))
            assert got == sorted(expected), (
                f"drift for phase {phase!r} kind {kind!r}: "
                f"seed={got} server={sorted(expected)}"
            )
        # A phase the server gives rules to must be seeded (except 'No Validation').
        if kinds:
            assert phase in seeded, f"phase {phase!r} has server rules but is not seeded"


def test_seed_has_no_extra_rules() -> None:
    """The seed may not invent a requirement the server does not enforce."""
    ts = _parse_ts_rules()
    seeded = _parse_seed()
    for phase, kinds in seeded.items():
        for kind, reqs in kinds.items():
            if kind in CONDITIONAL_KINDS:
                continue
            expected = set(ts.get(phase, {}).get(kind, []))
            extra = set(reqs) - expected
            assert not extra, f"seed invents {kind} rules for {phase!r}: {sorted(extra)}"


@pytest.mark.parametrize(("kind", "const_name"), sorted(CONDITIONAL_KINDS.items()))
def test_conditional_clearance_dates_match_constants(kind: str, const_name: str) -> None:
    """The Review clearance-conditional dates match their server constants."""
    expected = sorted(_ts_const_list(const_name))
    got = sorted(_parse_seed()["Review"][kind])
    assert got == expected, f"{kind} drift: seed={got} server={expected}"


def test_federal_comment_is_never_seeded() -> None:
    """'No Validation' must stay unseeded, or the view would report false phantoms."""
    assert "Federal Comment" not in _parse_seed()
