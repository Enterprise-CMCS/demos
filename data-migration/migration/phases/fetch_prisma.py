"""Fetch Prisma migration SQL from the DEMOS GitHub repo and verify the pinned hash.

The DEMOS app owns the source of truth for the `demos_app.*` schema
(tables, columns, FKs, indexes) via Prisma. Prisma stores its migrations as one
directory per migration (timestamp-prefixed name) under
``server/src/model/migrations/`` in the DEMOS repo
(https://github.com/Enterprise-CMCS/demos), each containing a single
``migration.sql`` file.

This module:

1. Calls the GitHub Contents API to list migration directories.
2. Filters to Prisma-shaped names (``^\\d{14}_``) and sorts them
   chronologically.
3. Fetches each ``migration.sql`` from ``raw.githubusercontent.com``.
4. Concatenates the bodies with banner comments separating them.
5. Caches the concatenated bytes under
   ``state/prisma_ddl/<sha256>.sql``.
6. **Fails loudly** if the SHA256 differs from the pinned value in
   ``reports/prisma_ddl.sha256``.

Drift is treated as a review-required event: a hash mismatch halts
``migrate ddl`` (and ``migrate fetch-prisma --verify-only``) so that
schema changes from upstream cannot land silently.
"""

from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.request
from collections.abc import Callable
from functools import partial
from pathlib import Path

from migration.lib import (
    PRISMA_CACHE_DIR,
    PRISMA_DDL_MANIFEST_FILE,
    PRISMA_PIN_FILE,
    PRISMA_SOURCE_FILE,
    Env,
    die,
    log,
    rel,
    ts,
)

DOWNLOAD_TIMEOUT_S = 30
USER_AGENT = "demos-data-migration/fetch_prisma"
# Prisma migration directories are named "<14-digit timestamp>_<slug>".
_MIGRATION_NAME_RE = re.compile(r"^\d{14}_")

# A URL -> bytes fetcher. Injected so tests pass a fake fetcher directly
# instead of monkeypatching the module-level _http_get.
HttpGet = Callable[..., bytes]


def _read_pin() -> str:
    """Return the trimmed SHA256 from ``reports/prisma_ddl.sha256`` or die."""
    if not PRISMA_PIN_FILE.exists():
        die(
            f"missing pin file {rel(PRISMA_PIN_FILE)}; "
            "create it with the expected sha256 of the concatenated "
            "Prisma migration SQL"
        )
    raw = PRISMA_PIN_FILE.read_text(encoding="utf-8").strip()
    sha = raw.split()[0] if raw else ""
    if len(sha) != 64 or not all(c in "0123456789abcdef" for c in sha):
        die(
            f"pin file {rel(PRISMA_PIN_FILE)} does not contain a valid hex sha256: {raw!r}"
        )
    return sha


def _sha256_bytes(b: bytes) -> str:
    """Return the lowercase hex SHA256 of ``b``."""
    return hashlib.sha256(b).hexdigest()


def _cache_path(sha: str) -> Path:
    """Return the on-disk cache location for the artifact with the given sha."""
    return PRISMA_CACHE_DIR / f"{sha}.sql"


def _http_get(url: str, env: Env, *, accept: str | None = None) -> bytes:
    """HTTP GET ``url`` with project User-Agent and optional auth/Accept headers."""
    req = urllib.request.Request(url)
    req.add_header("User-Agent", USER_AGENT)
    if accept is not None:
        req.add_header("Accept", accept)
    if env.github_token:
        req.add_header("Authorization", f"Bearer {env.github_token}")
    try:
        with urllib.request.urlopen(req, timeout=DOWNLOAD_TIMEOUT_S) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            die(
                f"GitHub returned {e.code} for {url}; "
                "set GITHUB_TOKEN to raise the rate limit"
            )
        die(f"HTTP {e.code} fetching {url}: {e}")
    except Exception as e:
        die(f"failed to fetch {url}: {e}")


def _default_get(env: Env) -> HttpGet:
    """Return an :data:`HttpGet` bound to ``env`` (uses the real network)."""
    return partial(_http_get, env=env)


def _list_migrations(env: Env, get: HttpGet) -> list[str]:
    """List Prisma migration directories from the DEMOS repo, oldest first."""
    api_url = (
        f"https://api.github.com/repos/{env.prisma_repo}/contents/"
        f"{env.prisma_migrations_path}?ref={env.prisma_repo_ref}"
    )
    log(f"listing prisma migrations: {api_url}")
    body = get(api_url, accept="application/vnd.github+json")
    try:
        entries = json.loads(body)
    except json.JSONDecodeError as e:
        die(f"GitHub Contents API returned non-JSON: {e}")
    if not isinstance(entries, list):
        die(f"GitHub Contents API returned unexpected payload: {entries!r}")
    dirs = [
        str(e["name"])
        for e in entries
        if isinstance(e, dict)
        and e.get("type") == "dir"
        and _MIGRATION_NAME_RE.match(str(e.get("name", "")))
    ]
    if not dirs:
        die(
            f"no Prisma migration directories found under {env.prisma_migrations_path} "
            f"in {env.prisma_repo}@{env.prisma_repo_ref}"
        )
    # Timestamp prefix gives a stable lexicographic chronological ordering.
    dirs.sort()
    log(f"found {len(dirs)} Prisma migration(s): {', '.join(dirs)}")
    return dirs


def _raw_url(env: Env, migration_dir: str) -> str:
    """Return the raw.githubusercontent.com URL for one ``migration.sql``."""
    return (
        f"https://raw.githubusercontent.com/{env.prisma_repo}/"
        f"{env.prisma_repo_ref}/{env.prisma_migrations_path}/"
        f"{migration_dir}/migration.sql"
    )


def _compose_ddl_with_manifest(
    env: Env, get: HttpGet | None = None
) -> tuple[bytes, list[str], list[dict[str, str]]]:
    """Fetch + concatenate every Prisma migration SQL; also return a manifest.

    Like :func:`_compose_ddl` but additionally returns ``manifest``: an
    ordered ``[{"name", "sha256"}]`` list, one entry per migration, where
    ``sha256`` is the digest of that migration's **raw** ``migration.sql``
    bytes (before any banner/terminator is appended). This is the
    banner-independent digest ``verify-prisma-local`` compares against a
    local ``../demos`` checkout.
    """
    get = get or _default_get(env)
    dirs = _list_migrations(env, get)
    manifest: list[dict[str, str]] = []
    parts: list[bytes] = []
    parts.append(
        (
            f"-- Concatenated Prisma migrations from {env.prisma_repo}@{env.prisma_repo_ref}\n"
            f"-- path: {env.prisma_migrations_path}\n"
            f"-- migrations ({len(dirs)}):\n"
        ).encode()
    )
    for d in dirs:
        parts.append(f"--   {d}\n".encode())
    parts.append(b"\n")
    for d in dirs:
        url = _raw_url(env, d)
        log(f"fetching {url}")
        body = get(url)
        manifest.append({"name": d, "sha256": _sha256_bytes(body)})
        parts.append(
            f"\n-- ============================================================\n"
            f"-- migration: {d}\n"
            f"-- source:    {url}\n"
            f"-- ============================================================\n".encode()
        )
        parts.append(body)
        if not body.endswith(b"\n"):
            parts.append(b"\n")
        # Some upstream migration.sql files omit the trailing ';' on their last
        # statement. Harmless applied alone, but the bodies are concatenated and
        # executed as one script, so an un-terminated final statement merges into
        # the next migration's first statement. A bare ';' on its own line closes
        # any open statement and is an inert empty statement when already closed.
        parts.append(b";\n")
    return b"".join(parts), dirs, manifest


def _compose_ddl(env: Env, get: HttpGet | None = None) -> tuple[bytes, list[str]]:
    """Fetch + concatenate every Prisma migration SQL into one byte stream.

    ``get`` is an injectable URL -> bytes fetcher (defaults to the real
    network-backed :func:`_http_get`); tests pass a fake fetcher.

    Returns ``(body, dirs)`` where ``dirs`` is the ordered list of
    migration directory names that contributed. Each migration's body
    is prefixed with a deterministic banner comment so the cached
    artifact is easy to audit by hand.
    """
    body, dirs, _ = _compose_ddl_with_manifest(env, get)
    return body, dirs


def _write_manifest(manifest: list[dict[str, str]]) -> None:
    """Persist the per-migration content digests for ``verify-prisma-local``."""
    PRISMA_DDL_MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    PRISMA_DDL_MANIFEST_FILE.write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    log(f"wrote {rel(PRISMA_DDL_MANIFEST_FILE)} ({len(manifest)} migrations)")


def _write_source_log(env: Env, sha: str, dirs: list[str]) -> None:
    """Record the repo coordinates + ordered migration list, for forensics."""
    PRISMA_SOURCE_FILE.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"repo: {env.prisma_repo}",
        f"ref: {env.prisma_repo_ref}",
        f"path: {env.prisma_migrations_path}",
        f"sha256: {sha}",
        f"fetched_at: {ts()}",
        f"migrations ({len(dirs)}):",
        *(f"  - {d}" for d in dirs),
        "",
    ]
    PRISMA_SOURCE_FILE.write_text("\n".join(lines), encoding="utf-8")


def ensure_prisma_ddl(
    env: Env | None = None, *, refresh: bool = False, get: HttpGet | None = None
) -> Path:
    """Ensure the pinned Prisma migration set is cached locally; return its path.

    Reads the pin from ``reports/prisma_ddl.sha256`` and looks for
    ``state/prisma_ddl/<sha>.sql``. On cache miss, lists migration
    directories via the GitHub Contents API, fetches each
    ``migration.sql`` from raw.githubusercontent.com, concatenates the
    bodies, verifies the SHA256 against the pin (failing loudly on
    drift), writes the cache file, and records source metadata to
    ``reports/prisma_ddl_source.txt``.

    With ``refresh=True`` the cache-hit short-circuit is bypassed: the
    artifact is always recomposed from upstream and re-verified against
    the pin (still failing loudly on drift), rebuilding the cache and
    source log. This is the deliberate escape hatch for revalidating
    against live upstream or rebuilding a stale/corrupt cache; it does
    not weaken the default offline guarantee relied on at cutover.
    """
    env = env or Env.load()
    sha = _read_pin()
    cached = _cache_path(sha)
    if cached.exists() and not refresh:
        actual = _sha256_bytes(cached.read_bytes())
        if actual != sha:
            die(
                f"cached prisma ddl at {rel(cached)} sha256 {actual} does not "
                f"match pin {sha}; remove the cache file and re-run"
            )
        log(
            f"prisma ddl cache hit: {rel(cached)}; "
            "skipping network (no upstream fetch). "
            "Pass --refresh to re-fetch from upstream and re-verify the pin."
        )
        return cached
    if refresh:
        log("refresh requested: recomposing prisma ddl from upstream")

    body, dirs, manifest = _compose_ddl_with_manifest(env, get)
    actual = _sha256_bytes(body)
    if actual != sha:
        die(
            f"prisma ddl drift: composed migration set sha256 {actual} does not "
            f"match pin {sha} in {rel(PRISMA_PIN_FILE)}; "
            "review the DEMOS schema change and update the pin if expected"
        )
    PRISMA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(body)
    _write_source_log(env, sha, dirs)
    _write_manifest(manifest)
    log(
        f"prisma ddl cached: {rel(cached)} "
        f"(sha256={sha}, migrations={len(dirs)})"
    )
    return cached


def run_fetch_prisma(
    verify_only: bool = False, refresh: bool = False, get: HttpGet | None = None
) -> Path:
    """Entry point for ``migrate fetch-prisma``.

    With ``verify_only=True`` (used in CI), the only operational
    difference is the log line; the artifact is still composed and
    hash-verified against the pin so PRs that bump the pin without
    matching upstream changes fail.

    With ``refresh=True`` the cache hit is bypassed so the artifact is
    re-fetched from upstream and re-verified against the pin.
    """
    env = Env.load()
    if verify_only:
        log("verifying prisma ddl pin only")
    return ensure_prisma_ddl(env, refresh=refresh, get=get)
