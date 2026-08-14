"""Guard: assert a local ``../demos`` checkout matches the pinned Prisma set.

The migrate-local devcontainer loader builds ``demos_app`` in a scratch
Postgres from the *pinned* concatenated Prisma migrations, then ships that
data onto a devcontainer schema built by the local ``../demos`` app's
``prisma migrate deploy``. Those two ``demos_app`` schemas must be identical,
which holds iff the local ``../demos`` migration set equals the pinned set.

This check recomputes a per-migration content manifest from the local
``$DEMOS_LOCAL/server/src/model/migrations/*/migration.sql`` files and diffs it
against ``reports/prisma_ddl.manifest.json`` (written by ``fetch-prisma``). Any
added, removed, or changed migration fails closed with an actionable message.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from migration.lib import (
    PRISMA_DDL_MANIFEST_FILE,
    ROOT_DIR,
    Env,
    die,
    log,
    rel,
)


def _local_migrations_dir(env: Env) -> Path:
    """Return the local ``../demos`` Prisma migrations directory (resolved)."""
    base = Path(env.demos_local)
    if not base.is_absolute():
        base = (ROOT_DIR / base).resolve()
    return base / env.prisma_migrations_path


def _local_manifest(migrations_dir: Path) -> list[dict[str, str]]:
    """Compute ``[{name, sha256}]`` from local ``*/migration.sql`` files.

    ``sha256`` is the digest of each migration's raw bytes, matching how
    ``fetch-prisma`` builds the pinned manifest, so equal files hash equal.
    Directories are ordered by name (the Prisma timestamp prefix), matching
    the pinned order.
    """
    if not migrations_dir.is_dir():
        die(
            f"local DEMOS migrations dir not found: {migrations_dir}; "
            "set DEMOS_LOCAL to the path of your ../demos checkout"
        )
    entries: list[dict[str, str]] = []
    for sub in sorted(p for p in migrations_dir.iterdir() if p.is_dir()):
        sql = sub / "migration.sql"
        if not sql.is_file():
            continue
        digest = hashlib.sha256(sql.read_bytes()).hexdigest()
        entries.append({"name": sub.name, "sha256": digest})
    if not entries:
        die(f"no migration.sql files found under {migrations_dir}")
    return entries


def _load_pinned_manifest() -> list[dict[str, str]]:
    """Read the pinned per-migration manifest or die with a fix instruction."""
    if not PRISMA_DDL_MANIFEST_FILE.exists():
        die(
            f"missing {rel(PRISMA_DDL_MANIFEST_FILE)}; "
            "run `uv run migrate fetch-prisma --refresh` to generate it"
        )
    raw = PRISMA_DDL_MANIFEST_FILE.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        die(f"{rel(PRISMA_DDL_MANIFEST_FILE)} is not valid JSON: {e}")
    if not isinstance(data, list) or not all(
        isinstance(e, dict) and "name" in e and "sha256" in e for e in data
    ):
        die(f"{rel(PRISMA_DDL_MANIFEST_FILE)} is not a [{{name, sha256}}] list")
    return [{"name": str(e["name"]), "sha256": str(e["sha256"])} for e in data]


def _diff_manifests(
    pinned: list[dict[str, str]], local: list[dict[str, str]]
) -> tuple[list[str], list[str], list[str]]:
    """Return ``(added, removed, changed)`` migration names between manifests.

    ``added`` are present locally but not pinned; ``removed`` are pinned but
    absent locally; ``changed`` exist in both with differing content digests.
    """
    pinned_by = {e["name"]: e["sha256"] for e in pinned}
    local_by = {e["name"]: e["sha256"] for e in local}
    added = sorted(local_by.keys() - pinned_by.keys())
    removed = sorted(pinned_by.keys() - local_by.keys())
    changed = sorted(
        name
        for name in pinned_by.keys() & local_by.keys()
        if pinned_by[name] != local_by[name]
    )
    return added, removed, changed


def run_verify_prisma_local() -> None:
    """Entry point for ``migrate verify-prisma-local``.

    Fails closed (``die``) when the local ``../demos`` migration set drifts
    from the pinned manifest, so a devcontainer load never ships data onto a
    mismatched schema. Logs an OK line with the migration count on success.
    """
    env = Env.load()
    migrations_dir = _local_migrations_dir(env)
    pinned = _load_pinned_manifest()
    local = _local_manifest(migrations_dir)
    added, removed, changed = _diff_manifests(pinned, local)
    if added or removed or changed:
        details = []
        if removed:
            details.append(f"missing locally: {', '.join(removed)}")
        if added:
            details.append(f"extra locally: {', '.join(added)}")
        if changed:
            details.append(f"content changed: {', '.join(changed)}")
        die(
            "local DEMOS migrations drift from the pinned Prisma set "
            f"({rel(PRISMA_DDL_MANIFEST_FILE)}): "
            + "; ".join(details)
            + ". Re-pin the migration (uv run migrate fetch-prisma --refresh) "
            "or check out the matching ../demos commit before migrate-local."
        )
    log(
        f"prisma-local OK: {len(local)} migration(s) match the pin "
        f"({rel(PRISMA_DDL_MANIFEST_FILE)})"
    )
