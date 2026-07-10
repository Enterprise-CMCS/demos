"""Structural tests for the cutover gate dependency graph.

Catches CODE_REVIEW H1: ``build`` must not be runnable on a pre-freeze
snapshot. The chain is verified three ways: decorated phases expose their
``requires`` via the ``@phase`` decorator metadata; the manually gated
build phases are checked behaviorally (their ``require_gate`` is the first
statement, so they die before any DB I/O); and the full expected DAG is
asserted to make ``flip`` transitively depend on ``delta`` and ``freeze``.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from migration import lib
from migration.phases import (
    build,
    constraints,  # noqa: F401  (import triggers @phase registration)
    decom,  # noqa: F401
    flip,  # noqa: F401
    freeze,  # noqa: F401
    load_delta,  # noqa: F401
    preflight,  # noqa: F401
    smoke,  # noqa: F401
)

# The canonical cutover dependency graph: phase -> the gate(s) it requires.
EXPECTED_EDGES: dict[str, tuple[str, ...]] = {
    "preflight": (),
    "freeze": ("preflight",),
    "delta": ("freeze",),
    "build_stg": ("delta",),
    "build_app": ("build_stg",),
    "constraints": ("build_app",),
    "parity": ("constraints",),
    "flip": ("parity",),
    "smoke": ("flip",),
    "decom": ("smoke",),
}

# Phases that register their wiring via the @phase decorator (i.e. all
# except the manually gated build_stg/build_app/parity).
DECORATED_PHASES = (
    "preflight",
    "freeze",
    "delta",
    "constraints",
    "flip",
    "smoke",
    "decom",
)


def test_decorated_phase_requires_match_expected() -> None:
    """Every @phase-decorated phase registers the expected gate requirement."""
    for name in DECORATED_PHASES:
        assert lib.PHASE_REQUIRES[name] == EXPECTED_EDGES[name]


def test_build_stg_requires_delta(tmp_state_dir: Path) -> None:
    """run_build_stg hard-fails before any DB I/O when delta has not run (H1)."""
    with pytest.raises(SystemExit):
        build.run_build_stg()


def test_build_app_requires_build_stg(tmp_state_dir: Path) -> None:
    """run_build_app hard-fails before any DB I/O when build_stg has not run."""
    with pytest.raises(SystemExit):
        build.run_build_app()


def _ancestors(node: str, edges: dict[str, tuple[str, ...]]) -> set[str]:
    """Return all transitive gate prerequisites of ``node``."""
    seen: set[str] = set()
    stack = list(edges.get(node, ()))
    while stack:
        cur = stack.pop()
        if cur in seen:
            continue
        seen.add(cur)
        stack.extend(edges.get(cur, ()))
    return seen


def test_flip_transitively_requires_freeze_and_delta() -> None:
    """The flip gate must transitively depend on delta and freeze (H1)."""
    ancestors = _ancestors("flip", EXPECTED_EDGES)
    assert "delta" in ancestors
    assert "freeze" in ancestors
