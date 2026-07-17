"""Typer CLI: `migrate <command>`."""

from __future__ import annotations

from collections.abc import Callable

import typer
from rich.table import Table

from migration.lib import PHASES, console, list_gates, set_verbose, stdout_console
from migration.phases import (
    build,
    constraints,
    decom,
    diagnose,
    fetch_prisma,
    fetch_prisma_schema,
    fk_candidates,
    flip,
    freeze,
    init_pg,
    load_delta,
    load_fidelity,
    load_full,
    parity,
    preflight,
    prod_schema_guard,
    reference_data,
    rollback,
    schema_snapshot,
    smoke,
    verify_prisma_local,
)

app = typer.Typer(
    add_completion=False,
    no_args_is_help=True,
    help="DEMOS migration toolkit. Run phases in order; each is gated and idempotent.",
)


@app.callback()
def _main(
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Verbose diagnostics: echo each SQL file as it is applied and "
        "surface PostgreSQL NOTICEs. Never changes gate or exit behavior. "
        "Also enabled by setting VERBOSE=1.",
    ),
) -> None:
    """DEMOS migration toolkit."""
    if verbose:
        set_verbose(True)


@app.command("init")
def cmd_init() -> None:
    """Apply sql/00_init/* (roles, schemas, extensions, helper fns)."""
    init_pg.run_init()


@app.command("fetch-prisma")
def cmd_fetch_prisma(
    verify_only: bool = typer.Option(
        False,
        "--verify-only",
        help="Fetch (or use cache) and verify the SHA256 against the pin; "
        "does not apply any DDL. Used by CI to detect drift on PRs.",
    ),
    refresh: bool = typer.Option(
        False,
        "--refresh",
        help="Bypass the local cache and re-fetch from upstream, then "
        "re-verify the SHA256 against the pin and rebuild the cache. "
        "Requires network (and likely GITHUB_TOKEN).",
    ),
) -> None:
    """Download + hash-pin the Prisma-generated DDL artifact."""
    fetch_prisma.run_fetch_prisma(verify_only=verify_only, refresh=refresh)


@app.command("fetch-prisma-schema")
def cmd_fetch_prisma_schema(
    verify_only: bool = typer.Option(
        False,
        "--verify-only",
        help="Fetch (or use cache) and verify the SHA256 against the pin; "
        "does not apply anything. Used by CI to detect drift on PRs.",
    ),
    refresh: bool = typer.Option(
        False,
        "--refresh",
        help="Bypass the local cache and re-fetch the .prisma model files "
        "from upstream, then re-verify the SHA256 against the pin and "
        "rebuild the cache. Requires network (and likely GITHUB_TOKEN).",
    ),
) -> None:
    """Download + hash-pin the declarative Prisma model files (cross-validation input)."""
    fetch_prisma_schema.run_fetch_prisma_schema(verify_only=verify_only, refresh=refresh)


@app.command("ddl")
def cmd_ddl() -> None:
    """Fetch Prisma DDL, reset demos_app schema, apply it, capture/drop FKs, apply supplements."""
    init_pg.run_ddl()


@app.command("seeds")
def cmd_seeds() -> None:
    """Apply sql/02_seeds_static and sql/03_seeds_limiters."""
    init_pg.run_seeds()


@app.command("crosswalks")
def cmd_crosswalks() -> None:
    """Apply sql/04_crosswalks (loads CSVs into mysql_raw.crosswalk_* tables)."""
    init_pg.run_crosswalks()


@app.command("id-maps")
def cmd_id_maps() -> None:
    """Apply sql/05_id_maps (creates and populates migration._id_map_*)."""
    init_pg.run_id_maps()


@app.command("load-full")
def cmd_load_full() -> None:
    """Full pgloader MySQL -> mysql_raw with drop list applied."""
    load_full.run_load_full()


@app.command("fk-candidates")
def cmd_fk_candidates() -> None:
    """Regenerate reports/generated/fk_candidates.csv (from mysql_raw + fk_overrides.yaml)."""
    fk_candidates.run_generate_fk_candidates()


@app.command("load-fidelity")
def cmd_load_fidelity(
    strict: bool = typer.Option(
        False,
        "--strict",
        help="Exit non-zero on any source/mysql_raw row-count mismatch. "
        "Default is informational (report + WARN only).",
    ),
) -> None:
    """Compare live MySQL vs mysql_raw row counts via DuckDB dual-attach (non-gating)."""
    load_fidelity.run_load_fidelity(strict=strict)


@app.command("schema-snapshot")
def cmd_schema_snapshot() -> None:
    """Snapshot the MySQL source information_schema to reports/schema_snapshot/."""
    schema_snapshot.run_schema_snapshot()


@app.command("reference-data")
def cmd_reference_data() -> None:
    """Dump MySQL *_rfrnc lookup rows + views to reports/reference_data/ (crosswalk input)."""
    reference_data.run_reference_data_dump()


@app.command("analyze")
def cmd_analyze() -> None:
    """Register reports/ CSV+Parquet artifacts as in-memory DuckDB views (offline analysis)."""
    from migration import duck

    duck.analyze()


@app.command("diagnose")
def cmd_diagnose() -> None:
    """Read-only triage: aggregate the non-gating probes (parity report-only +
    load-fidelity) into reports/runs/diagnose_<stamp>.md. Marks no gates; exits 0."""
    diagnose.run_diagnose()


@app.command("verify-prod-schema")
def cmd_verify_prod_schema(
    require_empty: bool = typer.Option(
        True,
        "--require-empty/--no-require-empty",
        help="Also assert the target's non-seeded demos_app tables are empty "
        "(greenfield). Disable when guarding the pre-rebuild DROP.",
    ),
) -> None:
    """Diff the live PROD demos_app against REFERENCE_PG_URL (schema+seeds+emptiness); HOLD on drift."""
    prod_schema_guard.run_prod_schema_guard(require_empty=require_empty, label="manual")


@app.command("verify-prisma-local")
def cmd_verify_prisma_local() -> None:
    """Assert the local ../demos migration set matches the pinned Prisma manifest; die on drift."""
    verify_prisma_local.run_verify_prisma_local()


# --- cutover phases (run in order) ---


@app.command("preflight")
def cmd_preflight() -> None:
    """P0 pre-flight checks."""
    preflight.run_preflight()


@app.command("freeze")
def cmd_freeze() -> None:
    """P1 capture freeze instant (DBA-coordinated)."""
    freeze.run_freeze()


@app.command("delta")
def cmd_delta() -> None:
    """P2 pgloader final delta."""
    load_delta.run_load_delta()


@app.command("build")
def cmd_build() -> None:
    """P3 build_stg + build_app."""
    build.run_build()


@app.command("constraints")
def cmd_constraints() -> None:
    """P5 apply FKs (NOT VALID then VALIDATE), triggers, indexes."""
    constraints.run_constraints()


@app.command("parity")
def cmd_parity(
    accept_pending: bool = typer.Option(
        False,
        "--accept-pending",
        help="Mark the parity gate green even when checks are PENDING. "
        "For dress rehearsals only; logs a WARN with the pending checks.",
    ),
) -> None:
    """P6 parity report."""
    parity.run_parity(accept_pending=accept_pending)


@app.command("flip")
def cmd_flip() -> None:
    """P7 go-live verification: DEMOS healthz + operator confirms PMDA is read-only.

    PMDA and DEMOS are separate apps on separate URLs; the dev team
    owns the URL/redirect work outside this repo, so this phase does
    not perform a DNS or load-balancer swap.
    """
    flip.run_flip()


@app.command("smoke")
def cmd_smoke() -> None:
    """P8 smoke suite."""
    smoke.run_smoke()


@app.command("decom")
def cmd_decom() -> None:
    """P10 decommission MySQL (Day 7+)."""
    decom.run_decom()


@app.command("rollback")
def cmd_rollback() -> None:
    """Rollback: restore PMDA to read-write; place DEMOS in read-only."""
    rollback.run_rollback()


# Resume executes phases in their canonical order. Keys MUST match
# entries in migration.lib.PHASES; `decom` is omitted because it is a
# Day-7+ chore, not part of the cutover-day sequence.
_RESUME_PHASES: dict[str, Callable[[], None]] = {
    "preflight": preflight.run_preflight,
    "freeze": freeze.run_freeze,
    "delta": load_delta.run_load_delta,
    "build_stg": build.run_build_stg,
    "build_app": build.run_build_app,
    "constraints": constraints.run_constraints,
    "parity": parity.run_parity,
    "flip": flip.run_flip,
    "smoke": smoke.run_smoke,
}


@app.command("resume")
def cmd_resume() -> None:
    """Run all remaining cutover phases from the current gate."""
    state = dict(list_gates())
    for name in PHASES:
        if name not in _RESUME_PHASES:
            continue
        if state.get(name):
            console.print(f"[dim]skip: {name} already done[/dim]")
            continue
        console.print(f"[bold cyan]=== running {name} ===[/bold cyan]")
        _RESUME_PHASES[name]()


@app.command("status")
def cmd_status() -> None:
    """Print current cutover gate state."""
    table = Table(title="Cutover gates", show_lines=False)
    table.add_column("Phase")
    table.add_column("Done")
    for name, ok in list_gates():
        table.add_row(name, "[green]x[/green]" if ok else " ")
    stdout_console.print(table)


def main() -> None:
    """Console-script entry point; invoke the Typer ``app``."""
    app()


if __name__ == "__main__":
    main()
