"""Tests for scripts/migrate_local.py (DB-free plan construction + runner).

The orchestrator lives under ``scripts/`` (not an installed package), so it is
imported by path. Every step is an argv command run through an injectable
runner, so the whole plan is asserted without touching a database.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

import migration.lib as mlib

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(_SCRIPTS_DIR))


def _load():
    spec = importlib.util.spec_from_file_location(
        "migrate_local", _SCRIPTS_DIR / "migrate_local.py"
    )
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["migrate_local"] = module
    spec.loader.exec_module(module)
    return module


ml = _load()


def _cfg(**over):
    base = dict(
        scratch_dsn="postgresql://scratch/db",
        devcontainer_dsn="postgresql://devhost/demos",
        demos_local=Path("/tmp/demos"),
    )
    base.update(over)
    return ml.LocalLoadConfig(**base)


# --- prisma_database_url --------------------------------------------------- #


def test_prisma_url_appends_schema() -> None:
    assert (
        ml.prisma_database_url("postgresql://h/demos")
        == "postgresql://h/demos?schema=demos_app"
    )


def test_prisma_url_appends_with_existing_query() -> None:
    assert (
        ml.prisma_database_url("postgresql://h/demos?sslmode=disable")
        == "postgresql://h/demos?sslmode=disable&schema=demos_app"
    )


def test_prisma_url_preserves_existing_schema() -> None:
    url = "postgresql://h/demos?schema=demos_app"
    assert ml.prisma_database_url(url) == url


# --- build_plan ------------------------------------------------------------ #


def test_plan_full_order_and_content() -> None:
    steps = ml.build_plan(_cfg())
    labels = [s.label for s in steps]
    assert labels[0] == "verify-prisma-local"
    # Scratch build runs every phase in order.
    assert [s.label for s in steps if s.label.startswith("scratch:")] == [
        f"scratch:{p}" for p in ml.BUILD_PHASES
    ]
    # Deploy precedes truncate; dump precedes restore; dbrefresh precedes smoke.
    assert labels.index("prisma-migrate-deploy") < labels.index("truncate-devcontainer")
    assert labels.index("dump-demos_app") < labels.index("restore-demos_app")
    assert labels.index("dbrefresh") < labels.index("smoke")
    assert labels[-1] == "smoke"


def test_plan_scratch_steps_carry_pg_url() -> None:
    steps = ml.build_plan(_cfg())
    scratch = next(s for s in steps if s.label == "scratch:init")
    assert scratch.env["PG_URL"] == "postgresql://scratch/db"
    assert "SKIP_JSONSCHEMA" not in scratch.env


def test_plan_skip_jsonschema_sets_env() -> None:
    steps = ml.build_plan(_cfg(skip_jsonschema=True))
    scratch = next(s for s in steps if s.label == "scratch:ddl")
    assert scratch.env["SKIP_JSONSCHEMA"] == "1"


def test_plan_no_build_skips_scratch() -> None:
    steps = ml.build_plan(_cfg(do_build=False))
    assert not any(s.label.startswith("scratch:") for s in steps)
    # Transfer + refresh + smoke still present.
    assert {"truncate-devcontainer", "restore-demos_app", "dbrefresh", "smoke"} <= {
        s.label for s in steps
    }


def test_plan_no_schema_skips_migrate_deploy() -> None:
    steps = ml.build_plan(_cfg(do_schema=False))
    assert "prisma-migrate-deploy" not in [s.label for s in steps]


def test_plan_no_dbrefresh_skips_dbrefresh() -> None:
    steps = ml.build_plan(_cfg(do_dbrefresh=False))
    assert "dbrefresh" not in [s.label for s in steps]


def test_plan_parity_step_optional() -> None:
    assert "scratch:parity" not in [s.label for s in ml.build_plan(_cfg())]
    steps = ml.build_plan(_cfg(parity=True))
    parity = next(s for s in steps if s.label == "scratch:parity")
    assert "--accept-pending" in parity.argv


def test_deploy_and_dbrefresh_run_in_server_dir_with_prisma_url() -> None:
    steps = ml.build_plan(_cfg(demos_local=Path("/tmp/demos")))
    deploy = next(s for s in steps if s.label == "prisma-migrate-deploy")
    assert deploy.cwd == Path("/tmp/demos/server")
    assert deploy.env["DATABASE_URL"].endswith("schema=demos_app")
    dbrefresh = next(s for s in steps if s.label == "dbrefresh")
    assert dbrefresh.env["IS_TEST_MIGRATION"] == "true"


def test_restore_disables_triggers() -> None:
    steps = ml.build_plan(_cfg())
    restore = next(s for s in steps if s.label == "restore-demos_app")
    assert "--disable-triggers" in restore.argv
    assert "--data-only" in restore.argv


def test_dump_excludes_prisma_migrations() -> None:
    steps = ml.build_plan(_cfg())
    dump = next(s for s in steps if s.label == "dump-demos_app")
    assert "--exclude-table=demos_app._prisma_migrations" in dump.argv
    assert "--data-only" in dump.argv


# --- run_plan -------------------------------------------------------------- #


def test_run_plan_invokes_runner_in_order() -> None:
    steps = ml.build_plan(_cfg())
    seen: list[str] = []
    ml.run_plan(steps, runner=lambda s: seen.append(s.label))
    assert seen == [s.label for s in steps]


def test_run_plan_aborts_on_failure() -> None:
    steps = ml.build_plan(_cfg())
    seen: list[str] = []

    def runner(step) -> None:
        seen.append(step.label)
        if step.label == "truncate-devcontainer":
            raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        ml.run_plan(steps, runner=runner)
    # Stopped at the failing step; smoke never ran.
    assert "smoke" not in seen
    assert seen[-1] == "truncate-devcontainer"


# --- provisioning (in-devcontainer scratch) -------------------------------- #


def test_plan_no_provision_by_default() -> None:
    assert "provision-scratch" not in [s.label for s in ml.build_plan(_cfg())]


def test_plan_provision_step_ordered_before_build() -> None:
    steps = ml.build_plan(_cfg(provision_scratch=True, superuser_dsn="postgresql://su/demos"))
    labels = [s.label for s in steps]
    assert labels.index("verify-prisma-local") < labels.index("provision-scratch")
    assert labels.index("provision-scratch") < labels.index("scratch:init")


def test_plan_provision_step_carries_admin_env() -> None:
    steps = ml.build_plan(
        _cfg(
            provision_scratch=True,
            superuser_dsn="postgresql://su/demos",
            scratch_role="migration_owner",
            scratch_password="pw",  # pragma: allowlist secret
            scratch_db="demos_migration",
        )
    )
    prov = next(s for s in steps if s.label == "provision-scratch")
    assert prov.argv[0] == "sh"
    assert prov.argv[1].endswith("provision_scratch.sh")
    assert prov.env["ADMIN_DSN"] == "postgresql://su/demos"
    assert prov.env["SCRATCH_ROLE"] == "migration_owner"
    assert prov.env["SCRATCH_PASS"] == "pw"  # pragma: allowlist secret
    assert prov.env["SCRATCH_DB"] == "demos_migration"


# --- _config_from_args ----------------------------------------------------- #


def test_config_default_is_devcontainer_scratch(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(mlib.Env, "load", classmethod(lambda cls: mlib.Env(mysql_url="y")))
    cfg = ml._config_from_args(ml._parse_args([]))
    assert cfg.provision_scratch is True
    assert cfg.skip_jsonschema is True
    assert cfg.scratch_dsn.endswith("/demos_migration")
    assert cfg.scratch_role == "migration_owner"
    assert cfg.scratch_db == "demos_migration"
    assert cfg.superuser_dsn.endswith("/demos")


def test_config_external_scratch_uses_pg_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        mlib.Env,
        "load",
        classmethod(lambda cls: mlib.Env(mysql_url="y", pg_url="postgresql://ext/scratch")),
    )
    cfg = ml._config_from_args(ml._parse_args(["--external-scratch"]))
    assert cfg.provision_scratch is False
    assert cfg.scratch_dsn == "postgresql://ext/scratch"


def test_config_scratch_dsn_implies_external(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(mlib.Env, "load", classmethod(lambda cls: mlib.Env(mysql_url="y")))
    cfg = ml._config_from_args(ml._parse_args(["--scratch-dsn", "postgresql://x/y"]))
    assert cfg.provision_scratch is False
    assert cfg.scratch_dsn == "postgresql://x/y"


def test_config_external_scratch_requires_dsn(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        mlib.Env, "load", classmethod(lambda cls: mlib.Env(mysql_url="y", pg_url=""))
    )
    with pytest.raises(SystemExit):
        ml._config_from_args(ml._parse_args(["--external-scratch"]))
