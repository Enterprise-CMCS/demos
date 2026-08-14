"""Unit coverage for the parity gate plumbing."""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import parity


def _r(status: str) -> parity.CheckResult:
    """Return a throwaway :class:`CheckResult` whose name encodes its status."""
    return parity.CheckResult(name=f"check-{status}", status=status)


def _shaped_query(default: tuple[object, ...]):
    """A ``psql_query`` stub that returns the right *shape* per query.

    The count-style checks want a single scalar row; the row-count checks read
    ``migration._parity_row_counts`` (multi-column, or a sum triple); the held-row
    gates read their ``*_flags`` views (row-per-flag). Returning empties for the
    row-count/flags reads keeps those checks vacuously GREEN so the rollup is
    driven by ``default`` (the count-style value) alone. Check 4 stays PENDING:
    its ``leaked`` probe returns empty (no RED) while its ``pending_only_deferred``
    probe returns one deferral, which reconciles to PENDING against an absent
    baseline (tests point ``PARITY_ACCEPTED_DIR`` at an empty dir). The two
    ``_parity_pgm_dtl_tag*`` views and ``_parity_amendment_unmapped_status`` read
    empty so those stay vacuously GREEN (the fail-closed guards never red the
    rollup here).
    """

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "'leaked'" in sql:
            return []
        if "'pending_only_deferred'" in sql:
            return [(1, "no_approved_counterpart")]
        if "_parity_pgm_dtl_tag" in sql:
            return []
        if "_parity_amendment_unmapped_status" in sql:
            return []
        if "_flags" in sql:
            return []
        if "sum(source_count)" in sql:
            return [(0, 0, 0)]
        if "_parity_row_counts" in sql:
            return []
        return [default]

    return _q


def test_overall_empty_is_pending() -> None:
    """A report with no checks rolls up to PENDING."""
    rep = parity.ParityReport(generated_at="x")
    assert rep.overall == "PENDING"


def test_overall_all_green() -> None:
    """Every check GREEN -> overall GREEN."""
    rep = parity.ParityReport(generated_at="x", checks=[_r("GREEN"), _r("GREEN")])
    assert rep.overall == "GREEN"


def test_overall_any_red_dominates() -> None:
    """Any RED check forces the overall status to RED."""
    rep = parity.ParityReport(generated_at="x", checks=[_r("GREEN"), _r("PENDING"), _r("RED")])
    assert rep.overall == "RED"


def test_overall_pending_dominates_over_green() -> None:
    """A PENDING check downgrades an otherwise-GREEN report to PENDING."""
    rep = parity.ParityReport(generated_at="x", checks=[_r("GREEN"), _r("PENDING")])
    assert rep.overall == "PENDING"


def test_overall_red_beats_pending() -> None:
    """RED outranks PENDING in the rollup."""
    rep = parity.ParityReport(generated_at="x", checks=[_r("PENDING"), _r("RED")])
    assert rep.overall == "RED"


def test_pending_checks_listed() -> None:
    """``pending_checks`` returns only the names of PENDING-status checks."""
    rep = parity.ParityReport(
        generated_at="x",
        checks=[
            parity.CheckResult(name="a", status="GREEN"),
            parity.CheckResult(name="b", status="PENDING"),
            parity.CheckResult(name="c", status="PENDING"),
        ],
    )
    assert rep.pending_checks == ["b", "c"]


def test_build_parity_report_does_not_gate_or_die(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """The extracted report builder runs checks but never gates or dies.

    Even when the rollup is RED (non-zero psql_query counts drive check 3 RED),
    ``build_parity_report`` must return the report, mark no gate, and not exit --
    that is what makes it safe for the read-only ``diagnose`` command.
    """
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "RUNS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path / "reports" / "parity_accepted")
    (tmp_path / "state").mkdir()
    (tmp_path / "reports").mkdir()

    monkeypatch.setattr(parity, "apply_dir", lambda env, _d: 0)
    monkeypatch.setattr(parity, "psql_query", _shaped_query((1,)))
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [])

    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    report = parity.build_parity_report(env)

    assert report.overall == "RED"
    assert not lib.gate_path("parity").exists()


def test_run_parity_default_does_not_mark_pending_gate(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """Without ``--accept-pending`` a PENDING overall must exit non-zero and NOT mark.

    CODE_REVIEW H2: a PENDING rollup without ``--accept-pending`` must
    ``die`` (non-zero exit), not return silently with exit 0. The
    view-backed checks are stubbed to GREEN (count-style psql_query -> 0,
    row-count/flags reads empty) and the header-only fk_candidates.csv makes
    check 5 vacuously GREEN, so the rollup status is driven by check 4
    (pending/approved audit), which is PENDING here: one live deferral against an
    absent baseline (PARITY_ACCEPTED_DIR points at an empty tmp dir).
    """
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "RUNS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path / "reports" / "parity_accepted")
    (tmp_path / "state").mkdir()
    (tmp_path / "reports").mkdir()
    lib.mark_gate("constraints")

    monkeypatch.setattr(parity, "apply_dir", lambda env, _d: 0)
    monkeypatch.setattr(parity, "psql_query", _shaped_query((0,)))
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [])
    monkeypatch.setattr(
        parity.Env,
        "load",
        classmethod(lambda cls: lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")),
    )

    with pytest.raises(SystemExit) as exc_info:
        parity.run_parity()
    assert exc_info.value.code != 0
    assert "parity gate not green" in " ".join(capsys.readouterr().err.split())
    assert not lib.gate_path("parity").exists()


def test_run_parity_red_exits_nonzero(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """CODE_REVIEW H2: a RED overall must exit non-zero, not return silently.

    Asserting the status rollup is RED (``test_overall_any_red_dominates``)
    proves the *computation*; this asserts the *consequence* -- a RED report
    must ``die`` so ``make rebuild`` and CI cannot declare success over it.
    Non-zero psql_query counts drive check 3 (JSONB shape) to RED.
    """
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "RUNS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path / "reports" / "parity_accepted")
    (tmp_path / "state").mkdir()
    (tmp_path / "reports").mkdir()
    lib.mark_gate("constraints")

    monkeypatch.setattr(parity, "apply_dir", lambda env, _d: 0)
    monkeypatch.setattr(parity, "psql_query", _shaped_query((1,)))
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [])
    monkeypatch.setattr(
        parity.Env,
        "load",
        classmethod(lambda cls: lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")),
    )

    with pytest.raises(SystemExit) as exc_info:
        parity.run_parity()
    assert exc_info.value.code != 0
    assert "parity gate not green" in " ".join(capsys.readouterr().err.split())
    assert not lib.gate_path("parity").exists()


def test_run_parity_accept_pending_marks_gate(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """With ``accept_pending=True`` a PENDING overall must mark the gate."""
    monkeypatch.setattr(lib, "STATE_DIR", tmp_path / "state")
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "RUNS_DIR", tmp_path / "reports")
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path / "reports" / "parity_accepted")
    (tmp_path / "state").mkdir()
    (tmp_path / "reports").mkdir()
    lib.mark_gate("constraints")

    monkeypatch.setattr(parity, "apply_dir", lambda env, _d: 0)
    monkeypatch.setattr(parity, "psql_query", _shaped_query((0,)))
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [])
    monkeypatch.setattr(
        parity.Env,
        "load",
        classmethod(lambda cls: lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")),
    )

    parity.run_parity(accept_pending=True)
    assert lib.gate_path("parity").exists()


# ---------------------------------------------------------------------------
# Check 1: row-count reconciliation per BUILT family
# ---------------------------------------------------------------------------


def test_row_count_parity_green_when_reconciled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Every family with delta 0 (source = target + held) -> GREEN with a tally."""
    rows = [
        ("person", 1176, 1176, 0, 0),
        ("demonstration", 101, 100, 1, 0),
    ]
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: rows)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._row_count_parity(env)
    assert result.status == "GREEN"
    assert "person: 1176=tgt 1176+held 0" in result.detail


def test_row_count_parity_red_on_delta(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A non-zero delta means loadable rows vanished -> RED naming the family."""
    rows = [
        ("person", 1176, 1176, 0, 0),
        ("comment", 7335, 6700, 617, 18),
    ]
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: rows)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._row_count_parity(env)
    assert result.status == "RED"
    assert "comment: source 7335 != target 6700 + held 617 (delta 18)" in result.detail
    assert "1 family" in result.detail


def test_row_count_parity_vacuous_green_when_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No resolver rows yet (pre-build) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._row_count_parity(env)
    assert result.status == "GREEN"
    assert "vacuously satisfied" in result.detail


# ---------------------------------------------------------------------------
# Check 2: count-checksum cross-foot
# ---------------------------------------------------------------------------


def test_numeric_sum_parity_green_on_checksum(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Column totals cross-foot (source = target + held) -> GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(14932, 14225, 707)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._numeric_sum_parity(env)
    assert result.status == "GREEN"
    assert "source 14932 = target 14225 + held 707" in result.detail


def test_numeric_sum_parity_red_on_mismatch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A checksum the per-family check somehow missed -> RED."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(14932, 14225, 700)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._numeric_sum_parity(env)
    assert result.status == "RED"
    assert "source 14932 != target 14225 + held 700" in result.detail


def test_demonstration_id_provenance_green_on_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Zero rows in the provenance view -> GREEN with a descriptive detail."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(0,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_id_provenance(env)
    assert result.status == "GREEN"
    assert "PMDA id-map row" in result.detail


def test_demonstration_id_provenance_red_on_violations(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Any rows in the provenance view -> RED with the count surfaced."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(3,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_id_provenance(env)
    assert result.status == "RED"
    assert "3 demos_app.demonstration row(s)" in result.detail
    assert "_parity_demonstration_id_provenance" in result.detail


def test_demonstration_completeness_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No staging view yet (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_completeness(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_demonstration_completeness_green_on_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """View present and empty -> GREEN."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else [(0,)]

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_completeness(env)
    assert result.status == "GREEN"
    assert "every PMDA-resolved demonstration" in result.detail


def test_demonstration_completeness_red_on_unloaded(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Resolved demos missing from demonstration -> RED with sample ids."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "to_regclass" in sql:
            return [(True,)]
        if "count(*)" in sql:
            return [(2,)]
        return [("11-W-00123/4",), ("11-W-00999/9",)]

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_completeness(env)
    assert result.status == "RED"
    assert "2 PMDA-resolved demonstration(s)" in result.detail
    assert "11-W-00123/4" in result.detail
    assert "_parity_demonstration_completeness" in result.detail


def test_demonstration_phase_derived_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No staging view yet (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_phase_derived(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_demonstration_phase_derived_green_on_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """View present but no demonstrations loaded -> GREEN, empty tally."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_phase_derived(env)
    assert result.status == "GREEN"
    assert "no demonstrations loaded yet" in result.detail


def test_demonstration_phase_derived_green_with_tally(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Loaded demos -> GREEN (non-gating) with a per-path derivation tally."""

    tally_rows: list[tuple[object, ...]] = [
        ("Approved", "Approval Summary", "date-derived", 10),
        ("Under Review", "Review", "date-derived", 3),
        ("Approved", "Approval Summary", "approved-fallback", 5),
        ("Pre-Submission", "Concept", "concept-default", 2),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else tally_rows

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_phase_derived(env)
    assert result.status == "GREEN"  # non-gating by design
    assert "20 loaded demonstration(s)" in result.detail
    assert "date-derived" in result.detail
    assert "Approval Summary(Approved)=10" in result.detail
    assert "_parity_demonstration_phase_derived" in result.detail


def test_system_role_assignment_integrity_green_on_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Zero rows in the integrity view -> GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(0,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._system_role_assignment_integrity(env)
    assert result.status == "GREEN"
    assert "role_person_type" in result.detail


def test_system_role_assignment_integrity_red_on_violations(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Any rows -> RED naming the view and the count."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(4,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._system_role_assignment_integrity(env)
    assert result.status == "RED"
    assert "4 demos_app.system_role_assignment row(s)" in result.detail
    assert "_parity_system_role_assignment_integrity" in result.detail


def test_person_state_integrity_red_on_hard_violation(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A non-empty integrity view -> RED (does not read the flags view)."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(2,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "RED"
    assert "2 demos_app.person_state row(s)" in result.detail
    assert "_parity_person_state_integrity" in result.detail


def test_person_state_integrity_pending_on_new_flag(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A held flag absent from the accepted baseline -> PENDING (new unreviewed)."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "integrity" in sql:
            return [(0,)]
        return [(690, "XX", "state_user_all_states_XX")]

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "PENDING"
    assert "1 new unreviewed flag(s)" in result.detail
    assert "_parity_person_state_flags" in result.detail


def test_person_state_integrity_pending_when_baseline_unsigned(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Flags all in the baseline but it is not SME-signed -> PENDING."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "integrity" in sql:
            return [(0,)]
        return [(690, "XX", "state_user_all_states_XX")]

    (tmp_path / "person_state_flags.csv").write_text(
        "# Status: UNSIGNED\n# Reviewer:\n# Date:\n"
        "user_id,state_cd,reason\n690,XX,state_user_all_states_XX\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "PENDING"
    assert "not yet SME-signed" in result.detail


def test_person_state_integrity_green_when_baseline_signed(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Flags all in a SIGNED baseline -> GREEN naming reviewer and date."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "integrity" in sql:
            return [(0,)]
        return [(690, "XX", "state_user_all_states_XX")]

    (tmp_path / "person_state_flags.csv").write_text(
        "# Status: SIGNED\n# Reviewer: A. Analyst\n# Date: 2026-07-09\n"
        "user_id,state_cd,reason\n690,XX,state_user_all_states_XX\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "GREEN"
    assert "A. Analyst" in result.detail
    assert "2026-07-09" in result.detail


def test_person_state_integrity_red_ignores_baseline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A hard integrity violation is RED even if a baseline would accept it."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(2,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "RED"


def test_person_state_integrity_green_when_clean(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No hard violations and no flags -> GREEN."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(0,)] if "integrity" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._person_state_integrity(env)
    assert result.status == "GREEN"
    assert "no held state-authorization anomalies" in result.detail


# ---------------------------------------------------------------------------
# Accepted-flags baseline reader + classifier
# ---------------------------------------------------------------------------


def test_read_accepted_baseline_missing_is_unsigned(tmp_path: Path) -> None:
    """A missing baseline file yields an empty, unsigned baseline."""
    baseline = parity._read_accepted_baseline(tmp_path / "nope.csv", ["a"])
    assert baseline.keys == frozenset()
    assert baseline.signed is False


def test_read_accepted_baseline_unsigned_header(tmp_path: Path) -> None:
    """An UNSIGNED header (or blank reviewer/date) parses keys but signed=False."""
    path = tmp_path / "b.csv"
    path.write_text(
        "# Status: UNSIGNED\n# Reviewer:\n# Date:\na,b\n1,x\n2,y\n",
        encoding="utf-8",
    )
    baseline = parity._read_accepted_baseline(path, ["a", "b"])
    assert baseline.keys == frozenset({("1", "x"), ("2", "y")})
    assert baseline.signed is False


def test_read_accepted_baseline_signed_header(tmp_path: Path) -> None:
    """A SIGNED header with reviewer and date -> signed=True with metadata."""
    path = tmp_path / "b.csv"
    path.write_text(
        "# Status: SIGNED\n# Reviewer: A. Analyst\n# Date: 2026-07-09\na,b\n1,x\n",
        encoding="utf-8",
    )
    baseline = parity._read_accepted_baseline(path, ["a", "b"])
    assert baseline.keys == frozenset({("1", "x")})
    assert baseline.signed is True
    assert baseline.reviewer == "A. Analyst"
    assert baseline.date == "2026-07-09"


def test_read_accepted_baseline_signed_requires_reviewer(tmp_path: Path) -> None:
    """SIGNED status without a reviewer stays unsigned (no rubber-stamping)."""
    path = tmp_path / "b.csv"
    path.write_text(
        "# Status: SIGNED\n# Reviewer:\n# Date: 2026-07-09\na\n1\n",
        encoding="utf-8",
    )
    assert parity._read_accepted_baseline(path, ["a"]).signed is False


def test_classify_held_flags_new_flag_pending() -> None:
    """A live flag not in the baseline -> PENDING regardless of signature."""
    baseline = parity._AcceptedBaseline(
        keys=frozenset({("1",)}), signed=True, reviewer="x", date="2026-01-01"
    )
    status, phrase = parity._classify_held_flags({("1",), ("2",)}, baseline)
    assert status == "PENDING"
    assert "1 new unreviewed" in phrase


def test_classify_held_flags_subset_unsigned_pending() -> None:
    """Live flags subset of an unsigned baseline -> PENDING (awaiting sign-off)."""
    baseline = parity._AcceptedBaseline(
        keys=frozenset({("1",), ("2",)}), signed=False, reviewer="", date=""
    )
    status, phrase = parity._classify_held_flags({("1",)}, baseline)
    assert status == "PENDING"
    assert "not yet SME-signed" in phrase


def test_classify_held_flags_subset_signed_green() -> None:
    """Live flags subset of a signed baseline -> GREEN."""
    baseline = parity._AcceptedBaseline(
        keys=frozenset({("1",), ("2",)}), signed=True, reviewer="x", date="2026-01-01"
    )
    status, _ = parity._classify_held_flags({("1",)}, baseline)
    assert status == "GREEN"


# ---------------------------------------------------------------------------
# Check 12: demonstration_role_assignment integrity + accepted baseline
# ---------------------------------------------------------------------------


def test_dra_integrity_green_when_clean(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No hard violations and no held candidates -> GREEN."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(0,)] if "integrity" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_role_assignment_integrity(env)
    assert result.status == "GREEN"
    assert "no held candidates" in result.detail


def test_dra_integrity_green_when_baseline_signed(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Dropped candidates all in a SIGNED baseline -> GREEN."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "integrity" in sql:
            return [(0,)]
        return [(704, 2583, "Policy Technical Director", "demos-cms-user", "demonstration_not_loaded")]

    (tmp_path / "demonstration_role_assignment_flags.csv").write_text(
        "# Status: SIGNED\n# Reviewer: A. Analyst\n# Date: 2026-07-09\n"
        "legacy_user_id,legacy_demonstration_id,role_id,person_type_id,reason\n"
        "704,2583,Policy Technical Director,demos-cms-user,demonstration_not_loaded\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_role_assignment_integrity(env)
    assert result.status == "GREEN"
    assert "A. Analyst" in result.detail


def test_dra_integrity_pending_on_new_flag(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A dropped candidate absent from the baseline -> PENDING (new unreviewed)."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "integrity" in sql:
            return [(0,)]
        return [(704, 2583, "Policy Technical Director", "demos-cms-user", "demonstration_not_loaded")]

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._demonstration_role_assignment_integrity(env)
    assert result.status == "PENDING"
    assert "1 new unreviewed flag(s)" in result.detail


# ---------------------------------------------------------------------------
# Check 4: pending/approved unification audit + accepted-deferrals baseline
# ---------------------------------------------------------------------------


def test_pending_approved_red_on_leak(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A pending demo loaded as a demonstration -> RED, before any baseline read."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "'leaked'" in sql:
            return [(999, "11-W-00042/5")]
        return []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pending_approved_audit(env)
    assert result.status == "RED"
    assert "1 pending demonstration(s) were loaded" in result.detail
    assert "_parity_pending_approved" in result.detail


def test_pending_approved_vacuous_green(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No leak and nothing to defer -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pending_approved_audit(env)
    assert result.status == "GREEN"
    assert "vacuously satisfied" in result.detail


def test_pending_approved_pending_when_baseline_unsigned(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Deferrals all in the baseline but it is not SME-signed -> PENDING."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "'leaked'" in sql:
            return []
        return [(101, "no_approved_counterpart"), (102, "no_project_number")]

    (tmp_path / "pending_approved_deferrals.csv").write_text(
        "# Status: UNSIGNED\n# Reviewer:\n# Date:\n"
        "legacy_pendg_demo_id,reason\n"
        "101,no_approved_counterpart\n102,no_project_number\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pending_approved_audit(env)
    assert result.status == "PENDING"
    assert "not yet SME-signed" in result.detail


def test_pending_approved_green_when_baseline_signed(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Deferrals all in a SIGNED baseline -> GREEN naming reviewer and date."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "'leaked'" in sql:
            return []
        return [(101, "no_approved_counterpart"), (102, "no_project_number")]

    (tmp_path / "pending_approved_deferrals.csv").write_text(
        "# Status: SIGNED\n# Reviewer: A. Analyst\n# Date: 2026-07-09\n"
        "legacy_pendg_demo_id,reason\n"
        "101,no_approved_counterpart\n102,no_project_number\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pending_approved_audit(env)
    assert result.status == "GREEN"
    assert "A. Analyst" in result.detail


def test_pending_approved_pending_on_new_deferral(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A pending-only demo absent from the baseline -> PENDING (new unreviewed)."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "'leaked'" in sql:
            return []
        return [(101, "no_approved_counterpart"), (999, "no_approved_counterpart")]

    (tmp_path / "pending_approved_deferrals.csv").write_text(
        "# Status: SIGNED\n# Reviewer: A. Analyst\n# Date: 2026-07-09\n"
        "legacy_pendg_demo_id,reason\n101,no_approved_counterpart\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "PARITY_ACCEPTED_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pending_approved_audit(env)
    assert result.status == "PENDING"
    assert "1 new unreviewed flag(s)" in result.detail


def test_active_users_coverage_green_on_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Every active user migrated -> GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(0,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._active_users_coverage(env)
    assert result.status == "GREEN"
    assert "accessed since 2020" in result.detail


def test_active_users_coverage_red_with_sample(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Active users absent from the migrated set -> RED with sample emails."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "count(*)" in sql:
            return [(2,)]
        return [("a@example.gov",), ("b@example.gov",)]

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._active_users_coverage(env)
    assert result.status == "RED"
    assert "2 active PMDA user(s)" in result.detail
    assert "a@example.gov" in result.detail
    assert "_parity_active_users_coverage" in result.detail


def test_jsonb_shape_green_on_zero(monkeypatch: pytest.MonkeyPatch) -> None:
    """Zero failing rows in the BN-oracle view -> GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(0,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._jsonb_shape(env)
    assert result.status == "GREEN"
    assert "budget_neutrality" in result.detail


def test_jsonb_shape_red_on_violations(monkeypatch: pytest.MonkeyPatch) -> None:
    """Any failing rows -> RED naming the view."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(2,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._jsonb_shape(env)
    assert result.status == "RED"
    assert "_parity_jsonb_shape" in result.detail


def test_read_reconstructed_fks_filters_and_qualifies(tmp_path: Path) -> None:
    """Only HIGH/MED rows are kept; to_table schema defaults to the child's."""
    csv_path = tmp_path / "fk_candidates.csv"
    csv_path.write_text(
        "from_table_qual,from_column,to_table,to_column,confidence,notes\n"
        "mysql_raw.mdcd_demo,state_id,geo_ansi_state_rfrnc,state_id,HIGH,x\n"
        "mysql_raw.mdcd_demo,user_id,demos_app.users,id,MED,y\n"
        "mysql_raw.mdcd_demo,low_id,foo,id,LOW,skip\n"
        "mysql_raw.mdcd_demo,none_id,foo,id,NONE,skip\n"
        "mysql_raw.mdcd_demo,blank_id,foo,id,,skip\n"
        "bare_no_schema,x,foo,id,HIGH,skip\n",
        encoding="utf-8",
    )
    edges = parity._read_reconstructed_fks(csv_path)
    assert len(edges) == 2
    first, second = edges
    assert (first.from_schema, first.from_table, first.from_column) == (
        "mysql_raw",
        "mdcd_demo",
        "state_id",
    )
    # bare to_table inherits the child's schema
    assert (first.to_schema, first.to_table, first.to_column) == (
        "mysql_raw",
        "geo_ansi_state_rfrnc",
        "state_id",
    )
    # qualified to_table keeps its own schema
    assert (second.to_schema, second.to_table) == ("demos_app", "users")


def test_read_reconstructed_fks_missing_or_header_only(tmp_path: Path) -> None:
    """A header-only or absent file yields no edges (vacuously green)."""
    header_only = tmp_path / "fk_candidates.csv"
    header_only.write_text(
        "from_table_qual,from_column,to_table,to_column,confidence,notes\n",
        encoding="utf-8",
    )
    assert parity._read_reconstructed_fks(header_only) == []
    assert parity._read_reconstructed_fks(tmp_path / "nope.csv") == []


def test_orphan_rows_query_is_identifier_safe() -> None:
    """The composed orphan query double-quotes every interpolated identifier."""
    fk = parity._ReconstructedFK(
        from_schema="mysql_raw",
        from_table="mdcd_demo",
        from_column="state_id",
        to_schema="mysql_raw",
        to_table="geo_ansi_state_rfrnc",
        to_column="state_id",
    )
    rendered = parity._orphan_rows_query(fk).as_string()
    assert '"mysql_raw"."mdcd_demo"' in rendered
    assert '"mysql_raw"."geo_ansi_state_rfrnc"' in rendered
    assert '"state_id"' in rendered


def test_orphans_green_when_no_candidates(monkeypatch: pytest.MonkeyPatch) -> None:
    """No HIGH/MED edges -> vacuously GREEN without touching the DB."""
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._orphans(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_orphans_nongating_green_and_logs_in_scope(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """In-scope orphans -> GREEN (non-gating) + per-row CSV, never a gate.

    Regression for RED-7: check 5 must NOT RED the cutover on pre-existing
    reconstructed-FK source orphans. The migration's declared target FKs are
    validated by the constraints phase; these edges are inferred/heuristic
    source integrity signals, so they are logged for SME review and the status
    stays GREEN.
    """
    fk = parity._ReconstructedFK(
        from_schema="mysql_raw",
        from_table="mdcd_demo",  # in the migration load surface
        from_column="state_id",
        to_schema="mysql_raw",
        to_table="geo_ansi_state_rfrnc",
        to_column="state_id",
    )
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [fk])
    monkeypatch.setattr(
        parity,
        "_existing_columns",
        lambda _env: {
            ("mysql_raw", "mdcd_demo", "state_id"),
            ("mysql_raw", "geo_ansi_state_rfrnc", "state_id"),
        },
    )
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [("XX",), ("YY",), ("XX",)])
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._orphans(env)
    assert result.status == "GREEN"  # non-gating by decision
    assert "mysql_raw.mdcd_demo.state_id" in result.detail
    assert "3 orphan(s)" in result.detail
    out = tmp_path / "orphans" / "reconstructed_fk_orphans.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "from_schema,from_table,from_column" in body
    assert "geo_ansi_state_rfrnc" in body
    assert "XX" in body


def test_orphans_uncheckable_absent_column_is_nongating(monkeypatch: pytest.MonkeyPatch) -> None:
    """An in-scope candidate naming a column absent from the loaded schema (the
    heuristic `id` PK guess) is reported and skipped -> GREEN (non-gating),
    never a crash."""
    fk = parity._ReconstructedFK(
        from_schema="mysql_raw",
        from_table="bdgt_ntrlty_demo_yr",  # in the migration load surface
        from_column="mdcd_demo_id",
        to_schema="mysql_raw",
        to_table="mdcd_demo",
        to_column="id",  # real PK is mdcd_demo_id; 'id' does not exist
    )
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [fk])
    monkeypatch.setattr(
        parity,
        "_existing_columns",
        lambda _env: {
            ("mysql_raw", "bdgt_ntrlty_demo_yr", "mdcd_demo_id"),
            ("mysql_raw", "mdcd_demo", "mdcd_demo_id"),
        },
    )

    def _fail(_env: object, _sql: object) -> list[tuple[object, ...]]:
        raise AssertionError("orphan count must not run for an uncheckable edge")

    monkeypatch.setattr(parity, "psql_query", _fail)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._orphans(env)
    assert result.status == "GREEN"
    assert "mysql_raw.mdcd_demo.id" in result.detail
    assert "absent" in result.detail


def test_orphans_uncheckable_type_mismatch_is_nongating(monkeypatch: pytest.MonkeyPatch) -> None:
    """An in-scope edge whose endpoints exist but whose count query raises (e.g.
    an integer-vs-text key comparison) is reported uncheckable -> GREEN
    (non-gating), not a crash."""
    import psycopg

    fk = parity._ReconstructedFK(
        from_schema="mysql_raw",
        from_table="mdcd_demo",
        from_column="role_cd",
        to_schema="mysql_raw",
        to_table="role_rfrnc",
        to_column="role_cd",
    )
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [fk])
    monkeypatch.setattr(
        parity,
        "_existing_columns",
        lambda _env: {
            ("mysql_raw", "mdcd_demo", "role_cd"),
            ("mysql_raw", "role_rfrnc", "role_cd"),
        },
    )

    def _raise(_env: object, _sql: object) -> list[tuple[object, ...]]:
        raise psycopg.errors.UndefinedFunction("operator does not exist: integer = text")

    monkeypatch.setattr(parity, "psql_query", _raise)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._orphans(env)
    assert result.status == "GREEN"
    assert "uncheckable" in result.detail


def test_orphans_skips_out_of_scope_edges(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """An edge whose child table is not in the migration load surface is skipped
    entirely: never queried, never logged. This is the RED-7 scoping decision --
    orphans in never-migrated source tables are out of scope for the gate."""
    fk = parity._ReconstructedFK(
        from_schema="mysql_raw",
        from_table="bdgt_ntrlty_wvr",  # NOT in the migration load surface
        from_column="mdcd_demo_id",
        to_schema="mysql_raw",
        to_table="mdcd_demo",
        to_column="mdcd_demo_id",
    )
    monkeypatch.setattr(parity, "_read_reconstructed_fks", lambda: [fk])

    def _fail_cols(_env: object) -> set[tuple[str, str, str]]:
        raise AssertionError("out-of-scope edge must not touch the schema")

    def _fail_q(_env: object, _sql: object) -> list[tuple[object, ...]]:
        raise AssertionError("out-of-scope edge must not be queried")

    monkeypatch.setattr(parity, "_existing_columns", lambda _env: set())
    monkeypatch.setattr(parity, "psql_query", _fail_q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._orphans(env)
    assert result.status == "GREEN"
    assert not (tmp_path / "orphans" / "reconstructed_fk_orphans.csv").exists()
    assert "out-of-scope" in result.detail


def test_approved_demo_held_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No staging view yet (to_regclass NULL) -> vacuously GREEN, no CSV."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._approved_demo_held_for_division(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_approved_demo_held_green_on_zero(monkeypatch: pytest.MonkeyPatch) -> None:
    """View present and empty -> GREEN, no demos held back."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._approved_demo_held_for_division(env)
    assert result.status == "GREEN"
    assert "no Approved demonstration was held back" in result.detail


def test_approved_demo_held_is_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Held-back Approved demos -> still GREEN (non-gating) AND logged per-row to CSV.

    The cutover scope decision is "hold back + report, do not block the gate."
    Asserting GREEN proves the *consequence* (a recorded hold-back never reds or
    pends the gate); asserting the CSV proves the per-row log the SME reviews
    exists. A future regression that flips this to PENDING/RED -- silently
    blocking the cutover on expected hold-backs -- fails here.
    """
    rows: list[tuple[object, ...]] = [
        ("uuid-1", "11-W-00123/4", "CA", 2, 0, None, None, "missing sdg_division; missing effective_date"),
        ("uuid-2", "11-W-00999/9", "NY", 2, None, "2020-01-01", "2025-01-01", "missing sdg_division"),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._approved_demo_held_for_division(env)

    assert result.status == "GREEN"  # non-gating by decision
    assert "2 Approved demonstration(s) held back" in result.detail
    assert "11-W-00123/4" in result.detail
    out = tmp_path / "orphans" / "approved_demo_held_for_division.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "demonstration_id,medicaid_id" in body
    assert "11-W-00999/9" in body
    assert "missing sdg_division" in body


def test_pgm_dtl_othr_held_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No view yet (to_regclass NULL) -> vacuously GREEN, no CSV."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_othr_held(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_pgm_dtl_othr_held_green_on_zero(monkeypatch: pytest.MonkeyPatch) -> None:
    """View present and empty -> GREEN, nothing held back."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_othr_held(env)
    assert result.status == "GREEN"
    assert "no other-program tag row was held back" in result.detail


def test_pgm_dtl_othr_held_is_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Held free-text othr rows -> still GREEN (non-gating) AND logged per-row.

    Per the SME rule a 1115 demonstration name is never turned into a tag; the
    unmatched rows are held and surfaced, never blocking the gate. Asserting
    GREEN proves the non-gating consequence; asserting the CSV proves the per-row
    SME log.
    """
    rows: list[tuple[object, ...]] = [
        (1, 1574, "uuid-1", "Badger Care", "free-text name is not a seeded demonstration-type tag (1115 name held per SME)"),
        (6, 1667, None, "Centennial Care", "free-text name is not a seeded demonstration-type tag (1115 name held per SME); parent demonstration not migrated"),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_othr_held(env)

    assert result.status == "GREEN"  # non-gating by SME decision
    assert "2 other-program (mdcd_othr_pgm_dtl) row(s) held back" in result.detail
    assert "Badger Care" in result.detail
    out = tmp_path / "orphans" / "pgm_dtl_tag_othr_held.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "legacy_id,legacy_demo_id,demonstration_id,othr_name,reason" in body
    assert "Centennial Care" in body
    assert "1115 name held per SME" in body


def test_pgm_dtl_unseeded_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No view yet (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_unseeded(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_pgm_dtl_unseeded_green_when_all_resolve(monkeypatch: pytest.MonkeyPatch) -> None:
    """View present and empty -> GREEN, every mapped tag_name is seeded."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_unseeded(env)
    assert result.status == "GREEN"
    assert "resolves to a seeded demonstration-type tag" in result.detail


def test_pgm_dtl_unseeded_reds_on_unseeded_mapping(monkeypatch: pytest.MonkeyPatch) -> None:
    """A mapped-but-unseeded tag_name fails the gate RED (fail-closed guard).

    The fold loader would silently skip such a mapping, dropping that table's
    rows with no error. This guard makes that visible and reds the gate so an
    operator either creates the tag or blanks the mapping.
    """
    rows: list[tuple[object, ...]] = [
        ("mdcd_bnfts_pgm_dtl", "Benefits"),
        ("mdcd_dsh_pgm_dtl", "Disproportionate Share Hospital (DSH)"),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._pgm_dtl_tag_unseeded(env)
    assert result.status == "RED"
    assert "2 pgm_dtl mapping(s)" in result.detail
    assert "mdcd_bnfts_pgm_dtl" in result.detail


def test_scope_coverage_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """demos_app not built (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._scope_coverage(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_scope_coverage_is_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """A populated coverage view -> GREEN (non-gating) AND written to CSV.

    Scope coverage is informational, never a gate: asserting GREEN proves a
    DEFERRED workflow (e.g. deliverable at 0 rows) cannot RED/PEND the cutover,
    and the CSV is the reviewer's gate-time coverage record.
    """
    rows: list[tuple[object, ...]] = [
        ("3", "demonstration", "BUILT", 1200),
        ("6", "deliverable", "DEFERRED", 0),
        ("4", "demonstration_type_tag_assignment", "PARTIAL", 80),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._scope_coverage(env)

    assert result.status == "GREEN"
    assert "1 BUILT" in result.detail
    assert "1 PARTIAL" in result.detail
    assert "1 DEFERRED" in result.detail
    out = tmp_path / "generated" / "scope_coverage.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "workflow,target_table,disposition,row_count" in body
    assert "deliverable,DEFERRED,0" in body


def test_state_region_drift_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Source/seed not present yet (to_regclass NULL) -> vacuously GREEN, no CSV."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._state_region_source_drift(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_state_region_drift_green_on_zero(monkeypatch: pytest.MonkeyPatch) -> None:
    """View present and empty -> GREEN, seed matches source."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._state_region_source_drift(env)
    assert result.status == "GREEN"
    assert "matches the source" in result.detail


def test_state_region_drift_is_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Divergent state-region rows -> still GREEN (non-gating) AND logged per-row.

    The seed is deliberately authoritative (R4), so a divergence from the source
    rgnl_ofc_cd is a review signal, never a build failure. Asserting GREEN proves
    the consequence; asserting the CSV proves the per-row log exists.
    """
    rows: list[tuple[object, ...]] = [
        ("CA", 9, 8, "region mismatch"),
        ("XX", 2, None, "state in seed not in source"),
        ("ZZ", None, 5, "state in source not in seed"),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._state_region_source_drift(env)

    assert result.status == "GREEN"  # non-gating by decision
    assert "3 state(s) diverge" in result.detail
    out = tmp_path / "orphans" / "state_region_drift.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "state_id,seed_region,source_region,reason" in body
    assert "region mismatch" in body


def test_amendment_load_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Staging/crosswalk not present yet (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_load(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_amendment_load_green_when_nothing_held(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Views present and empty -> GREEN, zero held/dropped, no CSVs written."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_load(env)
    assert result.status == "GREEN"
    assert "0 amendment(s) held back" in result.detail
    assert "0 signature(s) dropped" in result.detail
    assert not (tmp_path / "orphans" / "amendment_held.csv").exists()


def test_amendment_load_is_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Held amendments + dropped signatures -> still GREEN (non-gating) AND logged.

    The loader's parent-required + OA/OCD-only-signature choices are deliberate,
    so any excluded/NULLed row is a review signal, never a build failure.
    Asserting GREEN proves the consequence; the CSVs prove the per-row log.
    """
    held: list[tuple[object, ...]] = [("a1", "d1", "Amd One", "approved parent held back")]
    dropped: list[tuple[object, ...]] = [("a2", "Amd Two", 3)]
    phases: list[tuple[object, ...]] = [
        ("Approved", "Approval Summary", 2),
        ("Under Review", "Review", 1),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        if "to_regclass" in sql:
            return [(True,)]
        if "_parity_amendment_held" in sql:
            return held
        if "_parity_amendment_signature_dropped" in sql:
            return dropped
        return phases

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_load(env)

    assert result.status == "GREEN"  # non-gating by decision
    assert "1 amendment(s) held back" in result.detail
    assert "1 signature(s) dropped" in result.detail
    assert "Approval Summary=2" in result.detail

    held_csv = tmp_path / "orphans" / "amendment_held.csv"
    dropped_csv = tmp_path / "orphans" / "amendment_signature_dropped.csv"
    assert held_csv.exists()
    assert dropped_csv.exists()
    assert "amendment_uuid,demo_uuid,name,reason" in held_csv.read_text(encoding="utf-8")
    assert "approved parent held back" in held_csv.read_text(encoding="utf-8")
    assert "amendment_uuid,name,signature_cd" in dropped_csv.read_text(encoding="utf-8")


def test_amendment_unmapped_status_green_when_view_absent(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """No view yet (to_regclass NULL) -> vacuously GREEN."""
    monkeypatch.setattr(parity, "psql_query", lambda _env, _sql: [(False,)])
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_unmapped_status(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_amendment_unmapped_status_green_when_all_mapped(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """View present and empty -> GREEN; every staged amendment status maps."""

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_unmapped_status(env)
    assert result.status == "GREEN"
    assert "every staged amendment" in result.detail
    assert not (tmp_path / "orphans" / "amendment_unmapped_status.csv").exists()


def test_amendment_unmapped_status_reds_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """A staged amendment with a loaded parent but unmapped/NULL status is a
    fail-open silent drop: the loader's inner JOIN to crosswalk_amendment_status
    excludes it with no error and no held-row log, and check 19's accounting
    views share that same inner join so the drop is invisible there too. This
    fail-closed guard makes it visible, reds the gate, and logs every dropped
    row per-row for SME disposition.
    """
    rows: list[tuple[object, ...]] = [
        ("a1", "d1", "Pending-track Amendment", None),
        ("a2", "d2", "Another", None),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._amendment_unmapped_status(env)

    assert result.status == "RED"
    assert "2 staged amendment(s)" in result.detail
    csv_path = tmp_path / "orphans" / "amendment_unmapped_status.csv"
    assert csv_path.exists()
    text = csv_path.read_text(encoding="utf-8")
    assert "amendment_uuid,demo_uuid,name,status_cd" in text
    assert "Pending-track Amendment" in text


# ---------------------------------------------------------------------------
# Check 20: medicaid.gov 1115 outcome-fact parity
# ---------------------------------------------------------------------------

class _FakeConn:
    """Minimal stand-in for a psycopg autocommit connection."""

    def execute(self, sql: str, *args: object) -> None:
        pass

    def __enter__(self) -> _FakeConn:
        return self

    def __exit__(self, *exc: object) -> None:
        pass


def test_medicaid_gov_1115_green_when_csv_absent(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """No snapshot CSV committed -> vacuously GREEN."""
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._medicaid_gov_1115_parity(env)
    assert result.status == "GREEN"
    assert "vacuously green" in result.detail


def test_medicaid_gov_1115_green_when_no_discrepancies(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Snapshot loaded, view present and empty -> GREEN, no drift CSV."""

    # Create a dummy CSV so the exists() check passes.
    (tmp_path / "medicaid_gov_1115_snapshot.csv").write_text("match_status\n", encoding="utf-8")

    # Mock psycopg.connect to return a fake connection.
    import psycopg
    monkeypatch.setattr(psycopg, "connect", lambda *a, **kw: _FakeConn())
    monkeypatch.setattr(parity, "copy_csv_into_table", lambda *a, **kw: 0)

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else []

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._medicaid_gov_1115_parity(env)
    assert result.status == "GREEN"
    assert "no discrepancies" in result.detail
    assert not (tmp_path / "orphans" / "medicaid_gov_1115_drift.csv").exists()


def test_medicaid_gov_1115_non_gating_and_logs_csv(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Discrepancies -> still GREEN (non-gating) AND logged per-row."""

    (tmp_path / "medicaid_gov_1115_snapshot.csv").write_text("match_status\n", encoding="utf-8")
    (tmp_path / "medicaid_gov_1115_snapshot.meta.json").write_text(
        '{"generated_at": "2026-06-26T12:00:00-04:00"}', encoding="utf-8",
    )

    import psycopg
    monkeypatch.setattr(psycopg, "connect", lambda *a, **kw: _FakeConn())
    monkeypatch.setattr(parity, "copy_csv_into_table", lambda *a, **kw: 0)

    drift_rows: list[tuple[object, ...]] = [
        ("matched", "CA", "Demo A", "Approved", "2024-12-16", "2025-01-01", "2029-12-31",
         "11-W-00001/9", "Demo A", "status mismatch"),
        ("mg_only", "TX", "Texas Demo", "Approved", None, None, None,
         None, None, "on medicaid.gov but not migrated"),
        ("migrated_only", None, None, None, None, None, None,
         "11-W-00003/2", "NY Demo", "migrated but not on medicaid.gov"),
    ]

    def _q(_env: object, sql: str) -> list[tuple[object, ...]]:
        return [(True,)] if "to_regclass" in sql else drift_rows

    monkeypatch.setattr(parity, "psql_query", _q)
    monkeypatch.setattr(parity, "REPORTS_DIR", tmp_path)
    env = lib.Env(pg_url="u", mysql_url="u", mysql_db="", pg_db="")
    result = parity._medicaid_gov_1115_parity(env)

    assert result.status == "GREEN"
    assert "3 discrepancy" in result.detail
    assert "scraped 2026-06-26" in result.detail
    assert "matched=1" in result.detail
    assert "mg_only=1" in result.detail
    assert "migrated_only=1" in result.detail

    out = tmp_path / "orphans" / "medicaid_gov_1115_drift.csv"
    assert out.exists()
    body = out.read_text(encoding="utf-8")
    assert "match_status,mg_state,mg_name" in body
    assert "status mismatch" in body
    assert "on medicaid.gov but not migrated" in body
