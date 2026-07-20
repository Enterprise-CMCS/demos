"""Guardrail: no two SQL files in one sql/ subdir share a numeric prefix.

Every migration phase applies a directory via ``sorted(glob("*.sql"))``
(lexical filename sort), so the leading ``NN_`` prefix is the sole ordering
lever. Two files sharing a prefix leave their relative order to an accidental
alphabetical tiebreak on the descriptive name rather than an intended
sequence. This test fails loudly on any such collision so the numbering stays
an explicit, reviewable contract.

The prefix is the token before the first underscore, so the intentional
``02`` / ``02b`` split in ``00_init`` (which sorts deterministically) is not a
collision.
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
_SQL_DIR = _REPO_ROOT / "sql"


def _prefix(name: str) -> str:
    """Return the ordering token: everything before the first underscore."""
    return name.split("_", 1)[0]


def test_no_duplicate_numeric_prefix_within_a_sql_dir():
    offenders: dict[str, dict[str, list[str]]] = {}
    for sub in sorted(p for p in _SQL_DIR.iterdir() if p.is_dir()):
        by_prefix: dict[str, list[str]] = defaultdict(list)
        for sql_file in sorted(sub.glob("*.sql")):
            by_prefix[_prefix(sql_file.name)].append(sql_file.name)
        dupes = {prefix: names for prefix, names in by_prefix.items() if len(names) > 1}
        if dupes:
            offenders[sub.name] = dupes
    assert offenders == {}, (
        "SQL files sharing a numeric prefix within a directory "
        f"(ambiguous run order): {offenders}"
    )
