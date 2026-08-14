"""Lightweight CLI structural tests (no DB, no subprocess)."""

from __future__ import annotations

from migration import cli, lib


def _command_names(t_app) -> set[str]:  # type: ignore[no-untyped-def]
    return {c.name for c in t_app.registered_commands}


def test_resume_phases_are_subset_of_phases() -> None:
    """Every resume key must correspond to a known phase."""
    extra = set(cli._RESUME_PHASES) - set(lib.PHASES)
    assert not extra, f"resume references unknown phases: {extra}"


def test_resume_phases_in_canonical_order() -> None:
    """``_RESUME_PHASES`` must iterate in the canonical phase order."""
    resume_keys_in_phase_order = [p for p in lib.PHASES if p in cli._RESUME_PHASES]
    assert list(cli._RESUME_PHASES.keys()) == resume_keys_in_phase_order


def test_decom_intentionally_excluded_from_resume() -> None:
    """``decom`` is a Day-7+ chore and must not be triggered by ``resume``."""
    assert "decom" in lib.PHASES
    assert "decom" not in cli._RESUME_PHASES


def test_fetch_prisma_command_registered() -> None:
    """``migrate fetch-prisma`` is the operator entry point for the Prisma pin."""
    assert "fetch-prisma" in _command_names(cli.app)


def test_ddl_command_still_registered() -> None:
    """``migrate ddl`` remains the canonical schema-apply command."""
    assert "ddl" in _command_names(cli.app)
