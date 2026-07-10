"""Load the transformed ``demos_app`` into the local DEMOS devcontainer.

Implements the ``make migrate-local`` flow (approach C1): build the full
pipeline in a scratch Postgres, then ship ONLY the ``demos_app`` data onto a
devcontainer schema created canonically by the local ``../demos`` app's
``prisma migrate deploy``. The scratch build's ``mysql_raw``/``stg``/
``migration`` schemas never reach the devcontainer.

Steps (see runbooks/demos-devcontainer-load.md):

  1. verify-prisma-local  -- fail closed if ../demos drifts from the pin
  2. scratch build        -- init .. constraints against the scratch DSN
  3. prisma migrate deploy -- build the devcontainer demos_app schema
  4. truncate             -- clear devcontainer demos_app (keep _prisma_migrations)
  5. pg_dump              -- data-only demos_app from scratch (custom format)
  6. pg_restore           -- load into devcontainer with triggers disabled
  7. dbrefresh            -- add views/permissions/history-triggers/functions
  8. smoke                -- assert migrated rows are present

Every step is an argv command run through an injectable runner, so the plan is
unit-testable without touching a database.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent

# Migration CLI phase commands (hyphenated) run against the scratch DSN, in order.
BUILD_PHASES: tuple[str, ...] = (
    "init",
    "ddl",
    "load-full",
    "seeds",
    "crosswalks",
    "id-maps",
    "build",
    "constraints",
)

DUMP_FILE = ROOT_DIR / "state" / "migrate_local_demos_app.dump"

# Truncate every demos_app table except Prisma's bookkeeping table (which lives
# in demos_app because DATABASE_URL uses schema=demos_app). CASCADE clears
# child rows; scratch data (validated by the constraints phase) replaces them.
_TRUNCATE_SQL = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT format('%I.%I', schemaname, tablename) AS t
    FROM pg_tables
    WHERE schemaname = 'demos_app'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE 'TRUNCATE TABLE ' || r.t || ' CASCADE';
  END LOOP;
END
$$;
"""

# Fail (non-zero) if the load produced no demonstrations -- the minimal proof
# that migrated data reached the devcontainer.
_SMOKE_SQL = """
DO $$
BEGIN
  IF (SELECT count(*) FROM demos_app.demonstration) = 0 THEN
    RAISE EXCEPTION 'migrate-local smoke failed: demos_app.demonstration is empty';
  END IF;
END
$$;
"""


@dataclass(frozen=True)
class Step:
    """One argv command in the plan."""

    label: str
    argv: list[str]
    cwd: Path | None = None
    env: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class LocalLoadConfig:
    """Inputs for :func:`build_plan` (no environment access)."""

    scratch_dsn: str
    devcontainer_dsn: str
    demos_local: Path
    dump_file: Path = DUMP_FILE
    skip_jsonschema: bool = False
    do_build: bool = True
    do_schema: bool = True
    do_dbrefresh: bool = True
    parity: bool = False


def prisma_database_url(devcontainer_dsn: str) -> str:
    """Return ``devcontainer_dsn`` with ``schema=demos_app`` for Prisma.

    libpq tools (psql/pg_dump/pg_restore) use the bare DSN; Prisma needs the
    ``schema`` query param to target ``demos_app`` rather than ``public``.
    """
    if "schema=" in devcontainer_dsn:
        return devcontainer_dsn
    sep = "&" if "?" in devcontainer_dsn else "?"
    return f"{devcontainer_dsn}{sep}schema=demos_app"


def build_plan(cfg: LocalLoadConfig) -> list[Step]:
    """Return the ordered list of steps for the given configuration."""
    server_dir = cfg.demos_local / "server"
    prisma_url = prisma_database_url(cfg.devcontainer_dsn)
    scratch_env: dict[str, str] = {"PG_URL": cfg.scratch_dsn}
    if cfg.skip_jsonschema:
        scratch_env["SKIP_JSONSCHEMA"] = "1"

    steps: list[Step] = [
        Step(
            "verify-prisma-local",
            ["uv", "run", "migrate", "verify-prisma-local"],
            env={"DEMOS_LOCAL": str(cfg.demos_local)},
        )
    ]

    if cfg.do_build:
        for phase in BUILD_PHASES:
            steps.append(
                Step(f"scratch:{phase}", ["uv", "run", "migrate", phase], env=dict(scratch_env))
            )
        if cfg.parity:
            steps.append(
                Step(
                    "scratch:parity",
                    ["uv", "run", "migrate", "parity", "--accept-pending"],
                    env=dict(scratch_env),
                )
            )

    if cfg.do_schema:
        steps.append(
            Step(
                "prisma-migrate-deploy",
                ["npx", "prisma", "migrate", "deploy"],
                cwd=server_dir,
                env={"DATABASE_URL": prisma_url},
            )
        )

    steps.append(
        Step(
            "truncate-devcontainer",
            ["psql", cfg.devcontainer_dsn, "-v", "ON_ERROR_STOP=1", "-c", _TRUNCATE_SQL],
        )
    )
    steps.append(
        Step(
            "dump-demos_app",
            [
                "pg_dump",
                "-Fc",
                "--data-only",
                "--schema=demos_app",
                "--exclude-table=demos_app._prisma_migrations",
                "-f",
                str(cfg.dump_file),
                cfg.scratch_dsn,
            ],
        )
    )
    steps.append(
        Step(
            "restore-demos_app",
            [
                "pg_restore",
                "--data-only",
                "--disable-triggers",
                "--no-owner",
                "--exit-on-error",
                "-d",
                cfg.devcontainer_dsn,
                str(cfg.dump_file),
            ],
        )
    )

    if cfg.do_dbrefresh:
        steps.append(
            Step(
                "dbrefresh",
                ["npm", "run", "dbrefresh"],
                cwd=server_dir,
                env={"DATABASE_URL": prisma_url, "IS_TEST_MIGRATION": "true"},
            )
        )

    steps.append(
        Step(
            "smoke",
            ["psql", cfg.devcontainer_dsn, "-v", "ON_ERROR_STOP=1", "-c", _SMOKE_SQL],
        )
    )
    return steps


Runner = Callable[[Step], None]


def _default_runner(step: Step) -> None:
    """Execute one step via subprocess, inheriting + overriding the environment."""
    env = {**os.environ, **step.env}
    print(f"\n=== migrate-local: {step.label} ===", flush=True)
    subprocess.run(step.argv, cwd=step.cwd, env=env, check=True)


def run_plan(steps: Sequence[Step], runner: Runner = _default_runner) -> None:
    """Run each step in order; the runner raises to abort the flow."""
    for step in steps:
        runner(step)


def _resolve_demos_local(raw: str) -> Path:
    """Resolve a ``--demos-local`` value against the repo root when relative."""
    p = Path(raw)
    return p if p.is_absolute() else (ROOT_DIR / p).resolve()


def _config_from_args(args: argparse.Namespace) -> LocalLoadConfig:
    """Build a :class:`LocalLoadConfig`, falling back to ``Env`` for defaults."""
    from migration.lib import Env

    env = Env.load()
    scratch = args.scratch_dsn or env.pg_url
    if not scratch:
        raise SystemExit(
            "no scratch DSN: pass --scratch-dsn or set PG_URL to your scratch target"
        )
    devcontainer = args.devcontainer_dsn or env.devcontainer_pg_dsn()
    demos_local = _resolve_demos_local(args.demos_local or env.demos_local)
    return LocalLoadConfig(
        scratch_dsn=scratch,
        devcontainer_dsn=devcontainer,
        demos_local=demos_local,
        skip_jsonschema=args.skip_jsonschema,
        do_build=not args.no_build,
        do_schema=not args.no_schema,
        do_dbrefresh=not args.no_dbrefresh,
        parity=args.parity,
    )


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        prog="migrate-local",
        description="Load the transformed demos_app into the DEMOS devcontainer.",
    )
    ap.add_argument("--scratch-dsn", default="", help="scratch Postgres DSN (default: PG_URL)")
    ap.add_argument(
        "--devcontainer-dsn",
        default="",
        help="devcontainer Postgres DSN (default: DEVCONTAINER_PG_URL / Env)",
    )
    ap.add_argument("--demos-local", default="", help="path to ../demos checkout")
    ap.add_argument(
        "--skip-jsonschema",
        action="store_true",
        help="build without pg_jsonschema (stock scratch Postgres)",
    )
    ap.add_argument("--no-build", action="store_true", help="reuse an existing scratch build")
    ap.add_argument(
        "--no-schema", action="store_true", help="skip prisma migrate deploy (schema exists)"
    )
    ap.add_argument("--no-dbrefresh", action="store_true", help="skip DEMOS dbrefresh")
    ap.add_argument(
        "--parity", action="store_true", help="also run parity --accept-pending on scratch"
    )
    return ap.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    cfg = _config_from_args(_parse_args(argv))
    run_plan(build_plan(cfg))
    print("\nmigrate-local complete: demos_app loaded into the devcontainer.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
