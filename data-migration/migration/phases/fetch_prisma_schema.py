"""Fetch the DEMOS app's declarative ``.prisma`` model files and hash-pin them.

This is the model-file companion to ``fetch_prisma.py``. Where that module
fetches the compiled ``migration.sql`` artifact that ``migrate ddl`` applies,
this one fetches the declarative ``*.prisma`` model files under
``$PRISMA_SCHEMA_PATH`` (default ``server/src/model``). Those files are *not*
applied; they are a read-only cross-validation input consumed by
``migrate fk-candidates`` (and, later, JSONB/column-map lints).

Mechanics mirror ``fetch_prisma.py`` exactly so the two behave predictably:

1. List the repo tree once via the GitHub Git Trees API (``recursive=1``).
2. Filter to blobs under ``$PRISMA_SCHEMA_PATH`` whose path ends ``.prisma``.
3. Fetch each from ``raw.githubusercontent.com`` and concatenate (path-sorted)
   with banner comments.
4. Cache the bytes at ``state/prisma_schema/<sha256>.sql``.
5. **Fail loudly** if the SHA256 differs from ``reports/prisma_schema.sha256``.

The pin is *separate* from the migration pin so the two can drift
independently and CI catches each. This artifact is off the cutover apply
path, so a stale pin never blocks cutover -- it blocks the FK-candidate
cross-validation, which is a pre-cutover analysis step.
"""

from __future__ import annotations

import json
from pathlib import Path

from migration.lib import (
    PRISMA_SCHEMA_CACHE_DIR,
    PRISMA_SCHEMA_PIN_FILE,
    PRISMA_SCHEMA_SOURCE_FILE,
    Env,
    die,
    log,
    rel,
    ts,
)
from migration.phases.fetch_prisma import HttpGet, _default_get, _sha256_bytes


def _read_pin() -> str:
    """Return the trimmed SHA256 from ``reports/prisma_schema.sha256`` or die."""
    if not PRISMA_SCHEMA_PIN_FILE.exists():
        die(
            f"missing pin file {rel(PRISMA_SCHEMA_PIN_FILE)}; "
            "create it with the expected sha256 of the concatenated "
            "Prisma model files"
        )
    raw = PRISMA_SCHEMA_PIN_FILE.read_text(encoding="utf-8").strip()
    sha = raw.split()[0] if raw else ""
    if len(sha) != 64 or not all(c in "0123456789abcdef" for c in sha):
        die(
            f"pin file {rel(PRISMA_SCHEMA_PIN_FILE)} does not contain a valid hex sha256: {raw!r}"
        )
    return sha


def _cache_path(sha: str) -> Path:
    """Return the on-disk cache location for the artifact with the given sha."""
    return PRISMA_SCHEMA_CACHE_DIR / f"{sha}.sql"


def _normalize_root(path: str) -> str:
    """Return ``$PRISMA_SCHEMA_PATH`` without a trailing slash."""
    return path.rstrip("/")


def _list_schema_files(env: Env, get: HttpGet) -> list[str]:
    """List ``.prisma`` model file paths in the DEMOS repo, sorted by path."""
    api_url = (
        f"https://api.github.com/repos/{env.prisma_repo}/git/trees/"
        f"{env.prisma_repo_ref}?recursive=1"
    )
    log(f"listing prisma model files: {api_url}")
    body = get(api_url, accept="application/vnd.github+json")
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as e:
        die(f"GitHub Trees API returned non-JSON: {e}")
    if not isinstance(payload, dict) or not isinstance(payload.get("tree"), list):
        die(f"GitHub Trees API returned unexpected payload: {payload!r}")
    if payload.get("truncated"):
        die(
            f"GitHub Trees API truncated the listing for {env.prisma_repo}@"
            f"{env.prisma_repo_ref}; the repo tree is too large to enumerate "
            "in one call"
        )
    root = _normalize_root(env.prisma_schema_path)
    prefix = f"{root}/"
    paths = [
        str(e["path"])
        for e in payload["tree"]
        if isinstance(e, dict)
        and e.get("type") == "blob"
        and str(e.get("path", "")).startswith(prefix)
        and str(e.get("path", "")).endswith(".prisma")
    ]
    if not paths:
        die(
            f"no .prisma model files found under {root} "
            f"in {env.prisma_repo}@{env.prisma_repo_ref}"
        )
    paths.sort()
    log(f"found {len(paths)} prisma model file(s): {', '.join(paths)}")
    return paths


def _raw_url(env: Env, path: str) -> str:
    """Return the raw.githubusercontent.com URL for one ``.prisma`` file."""
    return (
        f"https://raw.githubusercontent.com/{env.prisma_repo}/"
        f"{env.prisma_repo_ref}/{path}"
    )


def _compose_schema(env: Env, get: HttpGet | None = None) -> tuple[bytes, list[str]]:
    """Fetch + concatenate every ``.prisma`` model file into one byte stream.

    ``get`` is an injectable URL -> bytes fetcher (defaults to the real
    network-backed :func:`_http_get`); tests pass a fake fetcher.

    Returns ``(body, paths)`` where ``paths`` is the path-sorted list of
    model files that contributed. Each file's body is prefixed with a
    deterministic banner comment so the cached artifact is auditable by hand.
    """
    get = get or _default_get(env)
    paths = _list_schema_files(env, get)
    parts: list[bytes] = []
    parts.append(
        (
            f"-- Concatenated Prisma model files from {env.prisma_repo}@{env.prisma_repo_ref}\n"
            f"-- root: {_normalize_root(env.prisma_schema_path)}\n"
            f"-- files ({len(paths)}):\n"
        ).encode()
    )
    for p in paths:
        parts.append(f"--   {p}\n".encode())
    parts.append(b"\n")
    for p in paths:
        url = _raw_url(env, p)
        log(f"fetching {url}")
        body = get(url)
        parts.append(
            f"\n-- ============================================================\n"
            f"-- file:   {p}\n"
            f"-- source: {url}\n"
            f"-- ============================================================\n".encode()
        )
        parts.append(body)
        if not body.endswith(b"\n"):
            parts.append(b"\n")
    return b"".join(parts), paths


def _write_source_log(env: Env, sha: str, paths: list[str]) -> None:
    """Record the repo coordinates + ordered file list, for forensics."""
    PRISMA_SCHEMA_SOURCE_FILE.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        f"repo: {env.prisma_repo}",
        f"ref: {env.prisma_repo_ref}",
        f"root: {_normalize_root(env.prisma_schema_path)}",
        f"sha256: {sha}",
        f"fetched_at: {ts()}",
        f"files ({len(paths)}):",
        *(f"  - {p}" for p in paths),
        "",
    ]
    PRISMA_SCHEMA_SOURCE_FILE.write_text("\n".join(lines), encoding="utf-8")


def ensure_prisma_schema(
    env: Env | None = None, *, refresh: bool = False, get: HttpGet | None = None
) -> Path:
    """Ensure the pinned ``.prisma`` model set is cached locally; return its path.

    Reads the pin from ``reports/prisma_schema.sha256`` and looks for
    ``state/prisma_schema/<sha>.sql``. On cache miss, lists the model files
    via the GitHub Trees API, fetches each from raw.githubusercontent.com,
    concatenates them path-sorted, verifies the SHA256 against the pin
    (failing loudly on drift), writes the cache file, and records source
    metadata to ``reports/prisma_schema_source.txt``.

    With ``refresh=True`` the cache-hit short-circuit is bypassed: the
    artifact is always recomposed from upstream and re-verified against the
    pin (still failing loudly on drift).
    """
    env = env or Env.load()
    sha = _read_pin()
    cached = _cache_path(sha)
    if cached.exists() and not refresh:
        actual = _sha256_bytes(cached.read_bytes())
        if actual != sha:
            die(
                f"cached prisma schema at {rel(cached)} sha256 {actual} does not "
                f"match pin {sha}; remove the cache file and re-run"
            )
        log(f"prisma schema cache hit: {rel(cached)}")
        return cached
    if refresh:
        log("refresh requested: recomposing prisma schema from upstream")

    body, paths = _compose_schema(env, get)
    actual = _sha256_bytes(body)
    if actual != sha:
        die(
            f"prisma schema drift: composed model set sha256 {actual} does not "
            f"match pin {sha} in {rel(PRISMA_SCHEMA_PIN_FILE)}; "
            "review the DEMOS schema change and update the pin if expected"
        )
    PRISMA_SCHEMA_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(body)
    _write_source_log(env, sha, paths)
    log(
        f"prisma schema cached: {rel(cached)} "
        f"(sha256={sha}, files={len(paths)})"
    )
    return cached


def load_prisma_schema_text() -> str | None:
    """Return the cached concatenated ``.prisma`` text, or ``None`` on cache miss.

    Does not fetch: this is the offline read path used by
    ``migrate fk-candidates``. The caller decides whether a missing cache is
    fatal; FK candidate generation treats it as "skip the .prisma layer".
    """
    if not PRISMA_SCHEMA_PIN_FILE.exists():
        return None
    raw = PRISMA_SCHEMA_PIN_FILE.read_text(encoding="utf-8").strip()
    sha = raw.split()[0] if raw else ""
    if len(sha) != 64:
        return None
    cached = _cache_path(sha)
    if not cached.exists():
        return None
    return cached.read_text(encoding="utf-8")


def run_fetch_prisma_schema(
    verify_only: bool = False, refresh: bool = False, get: HttpGet | None = None
) -> Path:
    """Entry point for ``migrate fetch-prisma-schema``.

    With ``verify_only=True`` (used in CI) the artifact is still composed and
    hash-verified against the pin, so PRs that bump the pin without matching
    upstream changes (or vice versa) fail. With ``refresh=True`` the cache hit
    is bypassed so the artifact is re-fetched from upstream and re-verified.
    """
    env = Env.load()
    if verify_only:
        log("verifying prisma schema pin only")
    return ensure_prisma_schema(env, refresh=refresh, get=get)
