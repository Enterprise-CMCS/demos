"""Shared helpers: env loading, paths, gate state, psycopg + pgloader wrappers."""

from __future__ import annotations

import csv
import functools
import os
import re
import shlex
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from collections.abc import Callable, Iterable, Iterator, Mapping, Sequence
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, LiteralString, NoReturn, ParamSpec, TypeVar, cast

import psycopg
import psycopg.sql
from jinja2 import Environment, StrictUndefined
from pydantic import PrivateAttr
from pydantic_settings import BaseSettings, SettingsConfigDict
from rich.console import Console
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    SpinnerColumn,
    TaskID,
    TextColumn,
    TimeElapsedColumn,
)

ROOT_DIR: Path = Path(__file__).resolve().parent.parent
SQL_DIR: Path = ROOT_DIR / "sql"
PGLOADER_DIR: Path = ROOT_DIR / "pgloader"
SCRIPTS_DIR: Path = ROOT_DIR / "scripts"
REPORTS_DIR: Path = ROOT_DIR / "reports"
# Timestamped, per-run artifacts (parity/load/diagnose/filter/pgloader logs).
# Ephemeral and gitignored; kept out of the tracked reports/ root.
RUNS_DIR: Path = REPORTS_DIR / "runs"
RUNBOOKS_DIR: Path = ROOT_DIR / "runbooks"
STATE_DIR: Path = ROOT_DIR / "state"
# Cached RDS CA bundle backing ``sslmode=verify-full`` for the DEMOS RDS
# connection (mirrors the app's ``rejectUnauthorized: true``).
CA_BUNDLE_FILE: Path = STATE_DIR / "rds-ca.pem"
PRISMA_CACHE_DIR: Path = STATE_DIR / "prisma_ddl"
PRISMA_PIN_FILE: Path = REPORTS_DIR / "prisma_ddl.sha256"
PRISMA_SOURCE_FILE: Path = REPORTS_DIR / "prisma_ddl_source.txt"
# Per-migration content digests ([{name, sha256}]) of the pinned Prisma
# migration set, written by `fetch-prisma`. Consumed by `verify-prisma-local`
# to fail closed when a local ../demos checkout drifts from the pin.
PRISMA_DDL_MANIFEST_FILE: Path = REPORTS_DIR / "prisma_ddl.manifest.json"
PRISMA_FKS_FILE: Path = STATE_DIR / "prisma_fks.json"
# The DEMOS app's declarative Prisma *model* files (server/src/model/**/*.prisma),
# distinct from the compiled migration.sql artifact. Fetched + hash-pinned
# separately (see migration/phases/fetch_prisma_schema.py) and parsed for the
# metadata the compiled SQL loses (@@map/@map, @relation, composites). Read-only
# cross-validation input -- never applied; off the cutover apply path.
PRISMA_SCHEMA_CACHE_DIR: Path = STATE_DIR / "prisma_schema"
PRISMA_SCHEMA_PIN_FILE: Path = REPORTS_DIR / "prisma_schema.sha256"
PRISMA_SCHEMA_SOURCE_FILE: Path = REPORTS_DIR / "prisma_schema_source.txt"
# demos_app.* tables that already held rows immediately after `migrate ddl`
# applied the Prisma artifact -- i.e. the Prisma-seeded reference/lookup
# tables. Captured at ddl time and excluded from the build_app truncation
# so the bulk build does not wipe data the migration never re-seeds.
PRISMA_SEEDED_TABLES_FILE: Path = STATE_DIR / "prisma_seeded_tables.json"
# Re-applied by run_ddl after DROP SCHEMA demos_app CASCADE to (re)create
# the empty schema before Prisma apply; named here so callers don't
# hard-code the path.
INIT_SCHEMAS_SQL: Path = SQL_DIR / "00_init" / "01_schemas.sql"
# Output directory for `migrate schema-snapshot`: review-friendly CSVs of
# the live MySQL source's information_schema (enum domains, declared FKs,
# view bodies, ...) -- the metadata pgloader discards when loading
# mysql_raw. Feeds crosswalk authoring, fk-candidates, and 23_app_derived.
SCHEMA_SNAPSHOT_DIR: Path = REPORTS_DIR / "schema_snapshot"
# Output directory for `migrate reference-data`: the row-data companion to
# the schema snapshot. Dumps every `*_rfrnc` lookup table's rows plus the
# source views' result sets so crosswalk authors have the real value domains
# (the source declares no enums, so these tables ARE the domains).
REFERENCE_DATA_DIR: Path = REPORTS_DIR / "reference_data"

# `console` (stderr) carries operator-facing logs and warnings; pipelines
# can redirect 2> /dev/null without losing structured output.
# `stdout_console` is reserved for tables and status output that ops
# scripts may capture (e.g. `migrate status | grep flip`).
console = Console(stderr=True)
stdout_console = Console()

_CRED_RE = re.compile(
    r"(://[^:/@\s'\"]+)"  # ://user (no specials)
    r":[^\s'\"]+?"  # :password (lazy; may contain @)
    r"@"  # final @ before host
    r"(?=[^/@:\s'\"]+"  # lookahead: host has no embedded @ : / ws quote
    r"(?:[:/?#]|\s|$|['\"]))"  # followed by a host terminator
)


def redact(s: str) -> str:
    # pragma: allowlist nextline secret
    """Replace ``scheme://user:password@host`` with ``scheme://user:****@host``. 
    Handles passwords that contain embedded ``@`` (common in unencoded
    connection strings). The lookahead anchors on a real host token so we
    don't redact stray ``@`` characters in shell flags.
    """
    return _CRED_RE.sub(r"\1:****@", s)


def ts() -> str:
    """ISO-8601 UTC timestamp with `Z` suffix; used in logs and gate files."""
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def file_stamp() -> str:
    """Compact UTC timestamp suitable for filenames (e.g. parity_<stamp>.md)."""
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%SZ")


def log(msg: str) -> None:
    """Write a timestamped, credential-redacted line to the stderr console."""
    console.print(f"[dim][{ts()}][/dim] {redact(msg)}")


def die(msg: str) -> NoReturn:
    """Log a FATAL message and exit the process with status 1."""
    console.print(f"[red][{ts()}] FATAL[/red] {msg}")
    sys.exit(1)


_verbose_override: bool | None = None


def set_verbose(enabled: bool) -> None:
    """Force verbose diagnostics on/off for this process (the CLI flag wins)."""
    global _verbose_override
    _verbose_override = enabled


def verbose_enabled() -> bool:
    """True when verbose diagnostics should print.

    A process-level override set by the ``--verbose`` CLI flag wins; otherwise
    the ``VERBOSE`` env var is honored. Mirrors :func:`_progress_enabled`. This
    only controls extra log detail -- it never changes exit or gate behavior.
    """
    if _verbose_override is not None:
        return _verbose_override
    return os.environ.get("VERBOSE", "").strip().lower() in ("1", "true", "yes")


def debug_log(msg: str) -> None:
    """Like :func:`log`, but emits only when :func:`verbose_enabled` is true."""
    if verbose_enabled():
        log(msg)


def skip_jsonschema() -> bool:
    """True when the build should not require the ``pg_jsonschema`` extension.

    Set ``SKIP_JSONSCHEMA=1`` to build against a stock Postgres that lacks
    ``pg_jsonschema``. The extension is migration-internal only (the BN parity
    oracle + the jsonb-shape parity check); no live ``demos_app.*`` column uses
    it. In skip mode ``run_init`` installs a permissive ``jsonb_matches_schema``
    stub so the registry/oracle/parity SQL still applies and runs (trivially
    GREEN on the jsonb-shape check). Never affects the shipped ``demos_app`` data.
    """
    return os.environ.get("SKIP_JSONSCHEMA", "").strip().lower() in ("1", "true", "yes")


# Loops below this many items render no bar (the per-item `>>>` log is clearer
# for a one-off file than a flickering 1/1 bar).
_PROGRESS_MIN_ITEMS = 2


def _progress_enabled() -> bool:
    """True when a live progress bar should render.

    Off when ``NO_PROGRESS`` is set or stderr is not a TTY (CI, redirected
    logs), so captured output stays the same plain per-item log lines.
    """
    if os.environ.get("NO_PROGRESS", "").strip().lower() in ("1", "true", "yes"):
        return False
    return bool(console.is_terminal)


class _NullProgress:
    """Disabled-bar handle: preserves the legacy ``>>> <label>`` log lines."""

    active = False

    def step(self, label: str) -> None:
        log(f">>> {label}")

    def note(self, label: str) -> None:
        """Update the spinner context line; no-op when bars are disabled."""


class _LiveProgress:
    """Live-bar handle bound to a Rich :class:`Progress` on the stderr console."""

    active = True

    def __init__(self, progress: Progress, task: TaskID) -> None:
        self._progress = progress
        self._task = task

    def step(self, label: str) -> None:
        """Advance one item and show ``label`` as the current description."""
        self._progress.update(self._task, description=label, advance=1)

    def note(self, label: str) -> None:
        """Update the description without advancing (for indeterminate spinners)."""
        self._progress.update(self._task, description=label)


@contextmanager
def progress_for(total: int, description: str) -> Iterator[_NullProgress | _LiveProgress]:
    """Yield a progress handle for a loop of ``total`` items.

    Renders a live Rich bar (spinner + bar + M/N + elapsed) on the stderr
    console when interactive and ``total >= _PROGRESS_MIN_ITEMS``; otherwise
    yields a null handle whose ``.step()`` emits the legacy ``>>> <label>``
    line, so non-interactive output is unchanged.
    """
    if not (_progress_enabled() and total >= _PROGRESS_MIN_ITEMS):
        yield _NullProgress()
        return
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(description, total=total)
        yield _LiveProgress(progress, task)


@contextmanager
def progress_spinner(description: str) -> Iterator[_NullProgress | _LiveProgress]:
    """Yield an indeterminate spinner handle for an opaque subprocess.

    Shows a spinner + elapsed time on the stderr console when interactive;
    ``.note(line)`` updates the trailing context. Yields a null handle (no
    output) when disabled.
    """
    if not _progress_enabled():
        yield _NullProgress()
        return
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        TimeElapsedColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(description, total=None)
        yield _LiveProgress(progress, task)


class Env(BaseSettings):
    """Snapshot of the connection-related environment variables.

    Backed by ``pydantic-settings``: values are read from the process
    environment first and from ``ROOT_DIR/.env`` as a fallback. The
    first ``Env.load()`` call in a process caches the result; every
    subsequent call returns the same instance, which matters for
    ``resume`` (otherwise eight phases would each re-read .env). Tests
    reset the cache via the ``reset_env_cache`` autouse fixture.

    Subprocesses spawned by ``run()`` (pgloader) inherit the current
    process environment, so values placed in ``os.environ`` by the
    operator (or pydantic-settings reading .env) propagate normally.
    """

    # Optional local/test override for the DEMOS RDS DSN. When unset,
    # pg_dsn()/pg_url_pgloader() resolve credentials from Secrets Manager.
    pg_url: str = ""
    # Reference PG DSN for the prod-schema guard: a live cluster that already
    # has the pinned Prisma artifact applied (typically the rehearsal/staging
    # demos_app). The guard (migration/phases/prod_schema_guard.py) diffs the
    # live target demos_app against this reference before init_pg.run_ddl's
    # irreversible DROP. Unset is allowed for local dev; required when the
    # target is the prod RDS (pg_url unset).
    reference_pg_url: str = ""
    mysql_url: str
    mysql_db: str = ""
    pg_db: str = ""
    # DEMOS RDS resolution: the admin credentials secret is fetched from
    # Secrets Manager on demand. ``demos_env`` derives the secret name
    # (``demos-<demos_env>-rds-admin``) unless ``db_secret_name`` overrides it.
    demos_env: str = "prod"
    db_secret_name: str = ""
    db_name: str = "demos"
    aws_region: str = "us-east-1"
    rds_ca_bundle_url: str = "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
    # GitHub coordinates of the DEMOS app repo where Prisma migrations live.
    # Defaults track the known location; override only for forks or testing.
    prisma_repo: str = "Enterprise-CMCS/demos"
    prisma_repo_ref: str = "main"
    prisma_migrations_path: str = "server/src/model/migrations"
    # Root under which the declarative `.prisma` model files live. Discovered
    # recursively (Git Trees API) and filtered to `*.prisma`.
    prisma_schema_path: str = "server/src/model"
    # Optional token for authenticated GitHub API calls (raises the rate
    # limit from 60/hr to 5000/hr). Reads `GITHUB_TOKEN` from the env.
    github_token: str = ""

    # DEMOS healthz endpoint probed by the flip phase. No default: an
    # unset value makes `flip` die rather than verify a placeholder URL.
    new_app_healthz_url: str = ""

    # pgloader v4 (Clojure/JVM) runner. When ``pgloader_jar`` points at a
    # pgloader.jar the load phases invoke ``<java_bin> -Xmx<mb>m -jar <jar>
    # <rendered>`` instead of the v3 ``pgloader`` binary on PATH -- the v3 SBCL
    # build (Homebrew) cannot read MySQL 8 ``utf8mb4_0900_*`` collations and
    # rejects the SBCL ``--dynamic-space-size`` flag. ``java_bin`` defaults to
    # ``java`` on PATH; set it to an explicit JDK path when Java is installed
    # off-PATH (e.g. ``/opt/homebrew/opt/openjdk/bin/java``).
    pgloader_jar: str = ""
    java_bin: str = ""

    # Path to a local checkout of the DEMOS app repo, used by
    # `verify-prisma-local` and the migrate-local devcontainer loader.
    # Relative paths resolve against the migration repo root.
    demos_local: str = "../demos"
    # DEMOS devcontainer Postgres that migrate-local ships the migrated
    # demos_app data into. Assembled from the parts below by
    # `devcontainer_pg_dsn()` so no credential string is hardcoded in source;
    # the defaults mirror the devcontainer's published local settings (see
    # ../demos/.devcontainer/docker-compose.yml). Set `devcontainer_pg_url` to
    # override the whole DSN.
    devcontainer_pg_url: str = ""
    devcontainer_pg_user: str = "postgres"
    devcontainer_pg_password: str = "postgres"
    devcontainer_pg_host: str = "localhost"
    devcontainer_pg_port: int = 5432
    devcontainer_pg_db: str = "demos"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    _secret_cache: dict[str, Any] | None = PrivateAttr(default=None)

    @classmethod
    def load(cls) -> Env:
        """Return the process-wide cached :class:`Env`, loading it on first call.

        Hard-fails via :func:`die` with a targeted message when ``MYSQL_URL``
        is missing, so operators get an actionable error instead of a pydantic
        validation traceback. ``PG_URL`` is optional: when unset, the DEMOS RDS
        DSN is resolved from Secrets Manager on demand (see :meth:`pg_dsn`).
        """
        global _env_cache
        if _env_cache is not None:
            return _env_cache
        try:
            # pydantic-settings populates required fields from env / .env at
            # call time; ty sees a plain pydantic model and flags the missing
            # kwargs, hence the ignore.
            _env_cache = cls()  # ty: ignore[missing-argument]
        except Exception as e:
            msg = str(e)
            if "mysql_url" in msg.lower():
                die("MYSQL_URL not set; copy .env.example to .env and fill it in")
            die(f"could not load environment: {e}")
        return _env_cache

    def secret_name(self) -> str:
        """Resolve the DEMOS RDS admin secret name (override or derived)."""
        return self.db_secret_name or f"demos-{self.demos_env}-rds-admin"

    def devcontainer_pg_dsn(self) -> str:
        """DSN of the DEMOS devcontainer Postgres for the migrate-local loader.

        Returns ``devcontainer_pg_url`` verbatim when set; otherwise assembles
        it from the ``devcontainer_pg_*`` parts (credentials URL-encoded). The
        DSN is built here rather than stored as a literal so no credential
        string lives in source.
        """
        if self.devcontainer_pg_url:
            return self.devcontainer_pg_url
        user = urllib.parse.quote(self.devcontainer_pg_user, safe="")
        password = urllib.parse.quote(self.devcontainer_pg_password, safe="")
        netloc = f"{user}:{password}@{self.devcontainer_pg_host}:{self.devcontainer_pg_port}"
        return urllib.parse.urlunsplit(
            ("postgresql", netloc, f"/{self.devcontainer_pg_db}", "", "")
        )

    def _secret(self) -> dict[str, Any]:
        """Fetch + memoize the RDS admin secret from Secrets Manager."""
        cache = self._secret_cache
        if cache is None:
            from migration import secrets

            data = secrets.get_secret_json(self.secret_name(), self.aws_region)
            missing = [k for k in ("username", "password", "host", "port") if k not in data]
            if missing:
                die(f"secret {self.secret_name()!r} missing fields: {', '.join(missing)}")
            self._secret_cache = data
            cache = data
        return cache

    def _ensure_ca_bundle(self) -> Path:
        """Download + cache the RDS CA bundle used for ``sslmode=verify-full``."""
        if not CA_BUNDLE_FILE.exists():
            ensure_dirs()
            log(f"fetching RDS CA bundle -> {rel(CA_BUNDLE_FILE)}")
            with urllib.request.urlopen(self.rds_ca_bundle_url, timeout=30) as resp:
                if resp.status != 200:
                    die(f"failed to fetch RDS CA bundle: status {resp.status}")
                CA_BUNDLE_FILE.write_bytes(resp.read())
        return CA_BUNDLE_FILE

    def _netloc(self) -> str:
        """``user:pass@host:port`` from the RDS admin secret (URL-encoded creds)."""
        data = self._secret()
        user = urllib.parse.quote(str(data["username"]), safe="")
        secret = urllib.parse.quote(str(data["password"]), safe="")
        return f"{user}:{secret}@{data['host']}:{data['port']}"

    def pg_dsn(self) -> str:
        """SSL-verified DEMOS RDS DSN for psycopg/psql connections.

        Returns the ``PG_URL`` override verbatim when set (local/testing);
        otherwise builds ``postgresql://...?sslmode=verify-full`` against the
        cached RDS CA bundle (mirrors the app's ``rejectUnauthorized: true``).
        """
        if self.pg_url:
            return self.pg_url
        ca = self._ensure_ca_bundle()
        query = urllib.parse.urlencode(
            {"sslmode": "verify-full", "sslrootcert": str(ca)}
        )
        return urllib.parse.urlunsplit(
            ("postgresql", self._netloc(), f"/{self.db_name}", query, "")
        )

    def pg_url_pgloader(self) -> str:
        """DEMOS RDS DSN for pgloader: ``sslmode=require`` (no custom-CA verify).

        pgloader's SBCL Postgres driver does not support custom-CA
        ``verify-full``; in-VPC ``require`` (encrypt without cert verification)
        is the pragmatic posture. Returns the ``PG_URL`` override verbatim
        when set.
        """
        if self.pg_url:
            return self.pg_url
        query = urllib.parse.urlencode({"sslmode": "require"})
        return urllib.parse.urlunsplit(
            ("postgresql", self._netloc(), f"/{self.db_name}", query, "")
        )


_env_cache: Env | None = None


def reset_env_cache() -> None:
    """Drop the cached Env so the next load() re-reads .env. Used in tests."""
    global _env_cache
    _env_cache = None


def ensure_dirs() -> None:
    """Create the on-disk directories the toolkit writes into (state, reports)."""
    STATE_DIR.mkdir(exist_ok=True)
    (REPORTS_DIR / "orphans").mkdir(parents=True, exist_ok=True)


def gate_path(name: str) -> Path:
    """Return the on-disk path of the gate-state file for ``name``."""
    return STATE_DIR / f"{name}.ok"


def require_gate(name: str) -> None:
    """Hard-fail via :func:`die` unless the gate ``name`` has been marked."""
    if not gate_path(name).exists():
        die(f"gate '{name}' not satisfied; run prior phase first")


def mark_gate(name: str) -> None:
    """Mark gate ``name`` satisfied by writing the current timestamp to its file."""
    ensure_dirs()
    gate_path(name).write_text(f"{ts()}\n", encoding="utf-8")
    log(f"gate '{name}' satisfied")


def clear_gate(name: str) -> None:
    """Remove the on-disk gate file for ``name`` if it exists."""
    p = gate_path(name)
    if p.exists():
        p.unlink()
        log(f"gate '{name}' cleared")


PHASES: tuple[str, ...] = (
    "preflight",
    "freeze",
    "delta",
    "build_stg",
    "build_app",
    "constraints",
    "parity",
    "flip",
    "smoke",
    "decom",
)


def list_gates() -> list[tuple[str, bool]]:
    """Return ``(phase, done)`` pairs for every phase in :data:`PHASES`."""
    return [(p, gate_path(p).exists()) for p in PHASES]


def run(cmd: Sequence[str], **kwargs: Any) -> subprocess.CompletedProcess[str]:
    """Run a subprocess; stream output by default; raise on non-zero.

    The logged argv is passed through `redact()` so connection strings of the
    form `************************ appear as `*************************
    """
    log(f"$ {' '.join(redact(shlex.quote(c)) for c in cmd)}")
    return subprocess.run(cmd, check=True, text=True, **kwargs)


def run_teed(
    cmd: Sequence[str],
    log_path: Path,
    *,
    on_line: Callable[[str], None] | None = None,
) -> int:
    """Run ``cmd``, tee its combined output byte-for-byte into ``log_path``.

    Streams stdout+stderr as raw bytes so ``log_path`` ends up equal to exactly
    what the child emitted -- callers parse it (e.g. :func:`assert_pgloader_ok`),
    so the bytes must not change. ``on_line`` receives each decoded line for
    best-effort live UI and must never affect what is written. Hard-fails on a
    non-zero exit, mirroring :func:`run`.
    """
    log(f"$ {' '.join(redact(shlex.quote(c)) for c in cmd)}")
    with log_path.open("wb") as out, subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    ) as proc:
        assert proc.stdout is not None
        for raw in proc.stdout:
            out.write(raw)
            if on_line is not None:
                on_line(raw.decode("utf-8", errors="replace").rstrip("\n"))
        code = proc.wait()
    if code != 0:
        die(f"command failed (exit {code}): {' '.join(redact(shlex.quote(c)) for c in cmd)}")
    return code


# pgloader runs in SBCL with a fixed Lisp heap. The built-in default (~1 GiB)
# is exhausted partway through a full PMDA load -- it dies with "Heap exhausted
# (no more space for allocation)" while creating indexes on the wide tables --
# so raise it well above that. Override per host via PGLOADER_DYNAMIC_SPACE_MB.
_DEFAULT_PGLOADER_DYNAMIC_SPACE_MB = 4096


@functools.lru_cache(maxsize=1)
def _pgloader_accepts_dynamic_space_size() -> bool:
    """Return True when the installed pgloader accepts ``--dynamic-space-size``.

    The flag is an SBCL runtime toplevel option. Some distributions' saved
    pgloader image passes toplevel runtime options through to SBCL, but others
    (e.g. the Homebrew 3.6.10 build compiled with SBCL 2.6.1) parse it as a
    pgloader option and reject it with ``Undefined option --dynamic-space-size``,
    dumping usage and exiting before any load runs. Probe the binary once and
    cache the answer so ``pgloader_argv`` only passes the flag where it works.
    """
    if shutil.which("pgloader") is None:
        return False
    try:
        proc = subprocess.run(
            ["pgloader", "--dynamic-space-size", "1024", "--version"],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return "Undefined option" not in (proc.stdout + proc.stderr)


def _pgloader_heap_mb() -> str:
    """Validate and return the pgloader heap size in MB (SBCL or JVM).

    Read from ``PGLOADER_DYNAMIC_SPACE_MB`` (default
    :data:`_DEFAULT_PGLOADER_DYNAMIC_SPACE_MB`); dies on a non-positive-integer
    value rather than passing junk to SBCL or the JVM.
    """
    raw = os.environ.get(
        "PGLOADER_DYNAMIC_SPACE_MB", str(_DEFAULT_PGLOADER_DYNAMIC_SPACE_MB)
    )
    if not raw.isdigit() or int(raw) <= 0:
        die(f"PGLOADER_DYNAMIC_SPACE_MB must be a positive integer (MB); got {raw!r}")
    return raw


def _resolve_pgloader_jar(env: Env | None) -> tuple[str, str]:
    """Return ``(jar_path, java_bin)`` for the v4 runner, or ``("", java_bin)`` for v3.

    Configuration comes from the :class:`Env` (populated from ``.env``) when
    provided, else from the process environment (``PGLOADER_JAR`` / ``JAVA_BIN``)
    so the pure ``pgloader_argv`` stays testable without loading ``.env``.
    """
    if env is not None:
        jar = env.pgloader_jar.strip()
        java_bin = env.java_bin.strip() or "java"
    else:
        jar = os.environ.get("PGLOADER_JAR", "").strip()
        java_bin = os.environ.get("JAVA_BIN", "").strip() or "java"
    if jar and not Path(jar).is_absolute():
        jar = str(ROOT_DIR / jar)
    return jar, java_bin


def pgloader_argv(rendered: Path, env: Env | None = None) -> list[str]:
    """Build the argv that runs a rendered ``.load`` file.

    Two runners are supported; both speak the same command-file syntax:

    * **v4 (Clojure/JVM)** -- selected when a pgloader jar is configured
      (``Env.pgloader_jar`` or ``PGLOADER_JAR``). Invoked as
      ``<java_bin> -Xmx<mb>m -jar <jar> <rendered>``; the JVM heap reuses the
      same ``PGLOADER_DYNAMIC_SPACE_MB`` knob as the v3 SBCL heap. Preferred for
      MySQL 8 sources, whose ``utf8mb4_0900_*`` collations the v3 SBCL build
      cannot read.
    * **v3 (Common Lisp)** -- the ``pgloader`` binary on PATH. Prepends SBCL's
      ``--dynamic-space-size`` only when the build accepts it (see
      :func:`_pgloader_accepts_dynamic_space_size`); builds that reject it fall
      back to the default heap with a WARN rather than exit 1 on an unknown
      option.
    """
    mb = _pgloader_heap_mb()
    jar, java_bin = _resolve_pgloader_jar(env)
    if jar:
        return [java_bin, f"-Xmx{mb}m", "-jar", jar, str(rendered)]
    if _pgloader_accepts_dynamic_space_size():
        return ["pgloader", "--dynamic-space-size", mb, str(rendered)]
    log(
        "pgloader build does not accept --dynamic-space-size; running with the "
        "default SBCL heap. Set PGLOADER_DYNAMIC_SPACE_MB on a build that "
        "supports the flag if a large load dies with 'Heap exhausted'."
    )
    return ["pgloader", str(rendered)]


def pgloader_runner_problem(env: Env) -> str | None:
    """Return an actionable message when the configured pgloader runner is unusable.

    Selects the same runner as :func:`pgloader_argv`: when a jar is configured,
    verify the jar exists and a Java runtime is resolvable; otherwise verify the
    v3 ``pgloader`` binary is on PATH. Returns ``None`` when the runner is ready.
    """
    jar, java_bin = _resolve_pgloader_jar(env)
    if jar:
        if not Path(jar).is_file():
            return f"PGLOADER_JAR is set but the jar was not found: {jar}"
        if shutil.which(java_bin) is None and not Path(java_bin).is_file():
            return (
                f"java runtime not found ({java_bin!r}); pgloader v4 needs Java 21+. "
                "Install a JDK or set JAVA_BIN to its java binary"
            )
        return None
    if shutil.which("pgloader") is None:
        return (
            "pgloader not found on PATH; install v3 (macOS: `brew install pgloader`) "
            "or set PGLOADER_JAR to a pgloader v4 jar before the MySQL -> mysql_raw load"
        )
    return None


def require_pgloader(env: Env) -> None:
    """Fail early with an actionable message when a pgloader load cannot run.

    ``load-full``/``load-delta`` shell out to pgloader (the v4 jar via Java, or
    the v3 binary) against a live MySQL source. Without this guard a missing
    runner surfaces only as a bare FileNotFoundError after an empty run log is
    already opened, and an unset MYSQL_URL as an opaque pgloader parse error.
    """
    problem = pgloader_runner_problem(env)
    if problem:
        die(problem)
    if not env.mysql_url:
        die("MYSQL_URL is not set; point it at the source MySQL before loading")


# pgloader exits 0 even when individual tables fail; the only signal is its
# log. Fatal markers it prints when a run blows up mid-stream:
_PGLOADER_FATAL_MARKERS = ("KABOOM", "FATAL", "An unhandled condition", "Database error")
# A timestamped ERROR-severity line ("<ts> ERROR ..."). pgloader logs these and
# still exits 0 with an otherwise-clean summary (e.g. it aborts metadata fetch on
# an unknown MySQL 8 collation: "NN fell through ECASE expression", or fails to
# connect to the source at all), so neither the fatal-marker nor the summary
# check would catch the empty load. The leading ISO-8601 timestamp may end in a
# "Z" UTC suffix (source-built binary) or a numeric offset like "-04:00"
# (Homebrew 3.6.10), so accept either -- a Z-only match let a failed connect
# slip through and mark the gate green.
_PGLOADER_ERROR_RE = re.compile(
    r"^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:?\d\d)? +ERROR ", re.MULTILINE
)
# The summary footer row: "  Total import time  <errors>  <rows> ...". The
# errors column is a count, or pgloader's success check mark (U+2713) when the
# whole run had zero errors -- both confirm the summary was reached.
_PGLOADER_TOTAL_RE = re.compile(r"Total import time\s+(\u2713|\d+)")


def assert_pgloader_ok(log_path: Path) -> None:
    """Hard-fail when a pgloader run reported any error in its log.

    pgloader returns exit status 0 even when individual tables error out
    (the counts go to its log summary), so trusting the exit code lets a
    partial load mark a gate green. This parses the captured log: it dies
    on any fatal marker, on a non-zero error count in the ``Total import
    time`` summary row, or when no summary row is present at all (the run
    cannot be confirmed to have completed).
    """
    if not log_path.exists():
        die(f"pgloader log not found: {rel(log_path)}")
    text = log_path.read_text(encoding="utf-8", errors="replace")

    for marker in _PGLOADER_FATAL_MARKERS:
        if marker in text:
            die(f"pgloader reported a fatal error ({marker!r}); see {rel(log_path)}")

    if _PGLOADER_ERROR_RE.search(text):
        hint = ""
        if "fell through ECASE" in text:
            hint = (
                " -- 'fell through ECASE expression' means pgloader cannot read a"
                " MySQL 8 collation (e.g. utf8mb4_0900_*); install a source-built"
                " pgloader (see docs/operator/howto-troubleshoot-pgloader.adoc)"
            )
        die(f"pgloader logged an ERROR{hint}; see {rel(log_path)}")

    m = _PGLOADER_TOTAL_RE.search(text)
    if m is None:
        die(f"pgloader log has no summary row; load unconfirmed; see {rel(log_path)}")
    token = m.group(1)
    errors = 0 if token == "\u2713" else int(token)
    if errors > 0:
        die(f"pgloader reported {errors} table-level error(s); see {rel(log_path)}")


def read_drop_list(path: Path | None = None) -> list[str]:
    """Parse the pgloader drop list. Comments (`#`) and blank lines are stripped.

    ``path`` is the file to read; defaults to ``pgloader/drop_list.txt`` so the
    real file is the production source of truth. Tests can pass a fixture path
    to avoid coupling assertions to the live list. Shared by the full and
    delta load phases so both exclude the same tables.
    """
    drop_file = path or (PGLOADER_DIR / "drop_list.txt")
    if not drop_file.exists():
        die(f"missing {drop_file}")
    names: list[str] = []
    for raw in drop_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#"):
            names.append(line)
    return names


def excluding_block(path: Path | None = None) -> str:
    """Return pgloader's ``EXCLUDING TABLE NAMES MATCHING ...`` clause.

    Returns an empty string when the drop list is empty so the rendered
    template falls through to pgloader's default (no exclusions).
    """
    names = read_drop_list(path)
    if not names:
        return ""
    quoted = ", ".join(f"'{n}'" for n in names)
    return f"EXCLUDING TABLE NAMES MATCHING {quoted}"


def cast_block(path: Path | None = None) -> str:
    """Return the shared pgloader CAST block text.

    ``path`` defaults to ``pgloader/casts.load`` so the full and delta loads
    render the exact same type-coercion rules; divergence here causes silent
    type drift (e.g. ``tinyint(1)``/``int(1)`` not mapped to boolean).
    """
    cast_file = path or (PGLOADER_DIR / "casts.load")
    if not cast_file.exists():
        die(f"missing {cast_file}")
    return cast_file.read_text(encoding="utf-8").rstrip("\n")


def psql_file(env: Env, sql_path: Path) -> None:
    """Apply one SQL file in its own implicit transaction (autocommit)."""
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        conn.execute(cast(LiteralString, sql_path.read_text(encoding="utf-8")))


def psql_command(env: Env, sql: str, params: Sequence[Any] | None = None) -> None:
    """Execute one SQL string against Postgres in autocommit mode.

    Per the ``psql_query`` policy, values MUST be passed via ``params`` rather
    than interpolated into ``sql``. ``params`` defaults to ``None`` so a
    parameterless statement skips psycopg's ``%`` placeholder parsing (a bare
    ``%`` in the SQL would otherwise raise at client-side conversion).
    """
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn:
        conn.execute(cast(LiteralString, sql), params)


def _sql_error_detail(path: Path, exc: psycopg.Error) -> str:
    """Build a legible failure message naming the SQL file and its diagnostics.

    psycopg raises a bare error that does not say which file in a batch failed;
    this prepends ``rel(path)`` and surfaces the server diagnostics (SQLSTATE,
    primary message, and DETAIL/HINT/CONTEXT when present) so an operator can
    locate the failure without bisecting the directory.
    """
    diag = exc.diag
    parts = [f"SQL failed in {rel(path)}"]
    head = " ".join(p for p in (diag.severity, diag.sqlstate) if p)
    primary = diag.message_primary or str(exc).strip()
    parts.append(f"{head}: {primary}" if head else primary)
    for label, value in (
        ("DETAIL", diag.message_detail),
        ("HINT", diag.message_hint),
        ("CONTEXT", diag.context),
    ):
        if value:
            parts.append(f"{label}: {value.strip()}")
    return "; ".join(parts)


def _execute_sql_file(conn: psycopg.Connection, path: Path) -> None:
    """Apply one SQL file; on a psycopg error die with file + diagnostics context."""
    try:
        conn.execute(cast(LiteralString, path.read_text(encoding="utf-8")))
    except psycopg.Error as exc:
        die(_sql_error_detail(path, exc))


def _attach_verbose_notices(conn: psycopg.Connection) -> None:
    """Under verbose mode, route PostgreSQL NOTICE messages to the debug log."""
    if verbose_enabled():
        conn.add_notice_handler(
            lambda diag: debug_log(f"NOTICE: {(diag.message_primary or '').strip()}")
        )


def psql_files(env: Env, files: Sequence[Path], pre_sql: str = "") -> None:
    """Apply multiple SQL files inside a single Postgres transaction.

    Opens one psycopg connection and one ``conn.transaction()`` block.
    ``pre_sql`` runs first inside that block (use it for
    ``SET CONSTRAINTS ALL DEFERRED`` and friends). Any failure rolls
    back every file; on success the whole batch commits as one.
    """
    if not files:
        log("psql_files: no files to apply")
        return
    with psycopg.connect(env.pg_dsn()) as conn, conn.transaction():
        _attach_verbose_notices(conn)
        if pre_sql:
            conn.execute(cast(LiteralString, pre_sql))
        with progress_for(len(files), "apply build files") as p:
            for f in files:
                p.step(rel(f))
                debug_log(f"applying {rel(f)}")
                _execute_sql_file(conn, f)


def psql_query(
    env: Env, sql: str, params: Sequence[Any] | None = None
) -> list[tuple[Any, ...]]:
    """Run a query and return rows. Use for small result sets in scripts.

    Policy: every `sql` string passed here MUST be a literal authored in
    migration code -- never built from user input or external metadata at
    runtime. Identifier interpolation (table/column names) MUST go through
    `psycopg.sql.Identifier` and `sql.SQL(...).format(...)`; values MUST go
    through `params`. `cast(LiteralString, sql)` documents that contract to
    psycopg's typed overload.

    ``params`` defaults to ``None`` (not ``()``): psycopg parses ``%``
    placeholders whenever params is not ``None``, so a parameterless query
    containing a literal ``%`` (e.g. ``LIKE '%\\_id' ESCAPE '\\'``) would
    raise at client-side query conversion. None disables that parsing.
    """
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn, conn.cursor() as cur:
        cur.execute(cast(LiteralString, sql), params)
        if cur.description is None:
            return []
        return list(cur.fetchall())


def psql_exec_composed(env: Env, query: psycopg.sql.Composed | psycopg.sql.SQL) -> None:
    """Execute a `psycopg.sql.SQL`/`Composed` statement (DDL with safe identifiers)."""
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn, conn.cursor() as cur:
        cur.execute(query)


def apply_dir(env: Env, directory: Path, *, expect_files: bool = False) -> int:
    """Apply every *.sql file in `directory` in lexical order. Returns count applied.

    Each file is applied in its own implicit transaction (autocommit on a
    shared psycopg connection), preserving the prior per-file commit
    semantics while avoiding one psql subprocess per file.

    With `expect_files=True`, hard-fails when the directory is missing or
    contains no .sql files. Default behavior treats missing/empty
    directories as a no-op so the scaffolded sql/ stages don't block early
    runs (see CODE_REVIEW N1 for the historical context).
    """
    if not directory.is_dir():
        if expect_files:
            die(f"required directory missing: {rel(directory)}")
        log(f"skip: directory not present: {rel(directory)}")
        return 0
    files = sorted(directory.glob("*.sql"))
    if expect_files and not files:
        die(f"required directory has no *.sql files: {rel(directory)}")
    if not files:
        return 0
    with psycopg.connect(env.pg_dsn(), autocommit=True) as conn, progress_for(
        len(files), f"apply {rel(directory)}"
    ) as p:
        _attach_verbose_notices(conn)
        for f in files:
            p.step(rel(f))
            debug_log(f"applying {rel(f)}")
            _execute_sql_file(conn, f)
    return len(files)


def copy_csv_into_table(
    conn: psycopg.Connection,
    schema: str,
    table: str,
    csv_path: Path,
    *,
    header_expect: Sequence[str] | None = None,
) -> int:
    """COPY a CSV into ``<schema>.<table>``. Returns the row count loaded.

    The shared CSV-to-Postgres primitive used by the crosswalks phase and the
    filter-override loader. Truncates the target table first (idempotent
    re-run), then ``COPY ... (<header>) FROM STDIN`` using the CSV header as
    the column list. Empty cells become NULL.

    Uses the default TEXT COPY format (tab-separated, ``\\N`` for NULL), which
    is what psycopg's ``write_row`` serializes; specifying ``FORMAT csv`` in
    the statement while ``write_row`` emits TEXT-format bytes causes the server
    to misparse the row (one comma-free line becomes a single field).

    Fail-closed: dies if the CSV file is missing or (when ``header_expect`` is
    set) the header does not match exactly. A present-but-malformed file is
    never silently skipped (CODE_REVIEW M2).
    """
    if not csv_path.exists():
        die(f"copy_csv_into_table: CSV not found: {rel(csv_path)}")
    with csv_path.open(encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        if header is None:
            die(f"copy_csv_into_table: CSV has no header: {rel(csv_path)}")
        if header_expect is not None and list(header) != list(header_expect):
            die(
                f"copy_csv_into_table: {rel(csv_path)} header {header!r} does not "
                f"match expected {list(header_expect)!r}"
            )
        rows = [r for r in reader if r and any(c.strip() for c in r)]

    ident = psycopg.sql.Identifier(schema, table)
    conn.execute(psycopg.sql.SQL("TRUNCATE {}").format(ident))
    if not rows:
        return 0

    # Empty strings -> None so COPY TEXT format writes \N (NULL), e.g.
    # sdg_division sentinel 0 -> NULL demos_text_id.
    typed_rows = [[(c if c != "" else None) for c in r] for r in rows]
    stmt = psycopg.sql.SQL("COPY {} ({}) FROM STDIN").format(
        ident,
        psycopg.sql.SQL(", ").join(psycopg.sql.Identifier(c) for c in header),
    )
    with conn.cursor() as cur, cur.copy(stmt) as copy:
        for r in typed_rows:
            copy.write_row(r)
    return len(typed_rows)


def require_schema(env: Env, schema: str) -> None:
    """Hard-fail if `schema` does not exist; cheap precondition for phases."""
    rows = psql_query(
        env,
        "SELECT 1 FROM information_schema.schemata WHERE schema_name = %s",
        (schema,),
    )
    if not rows:
        die(f"required schema '{schema}' not present; run init/ddl first")


_SCHEMA_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
_LIKE_PATTERN_RE = re.compile(r"^[A-Za-z0-9_%]+$")


def truncate_schema_data(
    env: Env,
    schema: str,
    exclude_patterns: Iterable[str] = (),
    exclude_tables: Iterable[str] = (),
) -> None:
    """TRUNCATE every base table in `schema`, minus excluded tables.

    `schema` must be a plain identifier (`[A-Za-z_][A-Za-z0-9_]*`); each
    `exclude_patterns` entry must be a SQL LIKE pattern restricted to
    `[A-Za-z0-9_%]+`; each `exclude_tables` entry must be a plain
    identifier matched by *exact* table name (no LIKE wildcards, so an
    underscore in a name is literal). Anything else is a programming
    error and raises via die() to make the constraint visible.
    """
    if not _SCHEMA_RE.match(schema):
        die(f"truncate_schema_data: schema {schema!r} is not a plain identifier")
    patterns = list(exclude_patterns)
    for p in patterns:
        if not _LIKE_PATTERN_RE.match(p):
            die(
                f"truncate_schema_data: exclude pattern {p!r} contains "
                "characters outside [A-Za-z0-9_%]"
            )
    tables = list(exclude_tables)
    for t in tables:
        if not _SCHEMA_RE.match(t):
            die(f"truncate_schema_data: exclude table {t!r} is not a plain identifier")
    clauses: list[str] = []
    if patterns:
        clauses.append(
            "NOT (" + " OR ".join(f"table_name LIKE '{p}'" for p in patterns) + ")"
        )
    if tables:
        clauses.append("table_name NOT IN (" + ", ".join(f"'{t}'" for t in tables) + ")")
    exclude_clause = "".join(f" AND {c}" for c in clauses)
    sql = f"""
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN
        SELECT format('TRUNCATE TABLE %I.%I CASCADE', table_schema, table_name) AS s
        FROM information_schema.tables
        WHERE table_schema = '{schema}' AND table_type = 'BASE TABLE'
        {exclude_clause}
      LOOP
        EXECUTE r.s;
      END LOOP;
    END $$;
    """
    psql_command(env, sql)


def rel(path: Path) -> str:
    """Path display: relative to ROOT_DIR when possible, else absolute."""
    try:
        return str(path.relative_to(ROOT_DIR))
    except ValueError:
        return str(path)


# StrictUndefined raises UndefinedError for any {{KEY}} not in `substitutions`,
# so a typo in a template fails loudly instead of silently shipping a
# half-rendered config. ``autoescape=False`` disables HTML escaping --
# pgloader templates are not HTML and would otherwise see `&` in
# connection strings rewritten. ``keep_trailing_newline=True`` preserves
# the trailing `\n` Jinja2 would otherwise strip.
#
# SECURITY: the Snyk Code "autoescape=False -> XSS" finding here is an
# accepted false positive. This Environment renders pgloader ``.load``
# command files (consumed by the pgloader binary), never HTML served to a
# browser -- there is no XSS sink. Enabling autoescape would HTML-entity-
# encode ``& < > ' "`` inside DSNs/SQL and corrupt the rendered config.
# See SECURITY_REVIEW.md.
_jinja_env = Environment(
    undefined=StrictUndefined,
    autoescape=False,
    keep_trailing_newline=True,
)


_PGLOADER_BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def strip_pgloader_comments(text: str) -> str:
    """Drop comments the pgloader v4 (JVM) command parser cannot handle.

    v4's Clojure parser rejects C-style ``/* */`` block comments and ``#``
    comments outright, and mis-splits statements on a ``;`` that appears
    inside a ``--`` line comment. The authored ``.load`` templates keep
    ``--`` comments for maintainers; this removes every comment from the
    file pgloader actually parses so comment content (semicolons, parens)
    can never trip the parser. Only whole-line comments are dropped, so an
    inline ``--`` inside a connection string stays intact.
    """
    without_blocks = _PGLOADER_BLOCK_COMMENT_RE.sub("", text)
    kept = [
        line
        for line in without_blocks.splitlines()
        if not line.lstrip().startswith(("--", "#"))
    ]
    return "\n".join(kept) + "\n"


def render_template(template: Path, output: Path, substitutions: Mapping[str, str]) -> None:
    """Render a Jinja2 template with ``{{KEY}}`` placeholders.

    Pgloader's PL/pgSQL dollar-quoted blocks (``$$ ... $$``) and ``%I``/``%s``
    format markers are inert under Jinja2; the only sigils to be aware of
    inside future templates are ``{{ }}``, ``{% %}``, and ``{# #}``.

    Comments are stripped (see ``strip_pgloader_comments``) before rendering
    so the emitted command file parses under both the v3 and v4 pgloader
    runners; stripping first also keeps expanded ``{{MYSQL_URL}}``/``{{PG_URL}}``
    credentials out of any header comment.

    Rendered files commonly contain expanded connection strings (PG_URL,
    MYSQL_URL); ``output`` is ``chmod 0600`` after write so credentials are
    not world-readable on disk.
    """
    raw = strip_pgloader_comments(template.read_text(encoding="utf-8"))
    rendered = _jinja_env.from_string(raw).render(substitutions)
    output.write_text(rendered, encoding="utf-8")
    os.chmod(output, 0o600)
    log(f"rendered {template.name} -> {rel(output)}")


P = ParamSpec("P")
R = TypeVar("R")

# Gate wiring registered by @phase, keyed by gate name -> required gates.
# Lets the dependency graph be introspected (tests/test_gate_graph.py)
# without executing any phase body. Manually gated phases (build_stg,
# build_app, parity) enforce their gates inline and are not registered here.
PHASE_REQUIRES: dict[str, tuple[str, ...]] = {}


def phase(
    name: str,
    *,
    requires: str | tuple[str, ...] = (),
    mark: bool = True,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Wrap a phase function with gate enforcement and (optionally) gate marking.

    - ``requires`` names the gate(s) that must already be satisfied. Pass
      either a single name or a tuple. Failure to satisfy any of them
      hard-fails via die().
    - ``name`` is the gate this phase will mark on clean exit. Set
      ``mark=False`` if the phase decides for itself when to mark (e.g.
      parity, which only marks on GREEN/--accept-pending).
    """
    required = (requires,) if isinstance(requires, str) else tuple(requires)
    PHASE_REQUIRES[name] = required

    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        @functools.wraps(fn)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for gate in required:
                require_gate(gate)
            result = fn(*args, **kwargs)
            if mark:
                mark_gate(name)
            return result

        return wrapper

    return decorator


def confirm(prompt: str, expected: str = "y") -> bool:
    """Prompt the operator; require exact ``expected`` response.

    Refuses to ever auto-accept in a non-interactive shell:
      - If ``MIGRATE_NONINTERACTIVE=1`` is set, raises via die() instead of
        silently returning False, so an operator who pipes a script into
        the CLI gets a loud error rather than every gated phase aborting.
      - On EOF (no stdin), returns False so the caller can choose to die.
    """
    if os.environ.get("MIGRATE_NONINTERACTIVE") == "1":
        die(
            f"refusing to prompt {prompt!r} with MIGRATE_NONINTERACTIVE=1; "
            "set the variable only for tooling that should never be allowed "
            "to confirm operator gates"
        )
    try:
        ans = input(f"  {prompt} ").strip()
    except EOFError:
        return False
    return ans.lower() == expected.lower()
