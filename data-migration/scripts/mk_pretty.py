#!/usr/bin/env python3
"""Rich-rendered output for the project Makefiles.

Subcommands:
  help <root|docs>        render the help screen as Rich panels + tables
  run  <label> <cmd...>   run a shell command with start/success/fail banners
  msg  <text...>          render a single success panel

Falls back to plain text if Rich is unavailable, so the env-lifecycle
targets (sync/clean) keep working even without an installed environment.
"""

from __future__ import annotations

import functools
import subprocess
import sys

try:
    from rich.console import Console, Group
    from rich.padding import Padding
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text

    _console = Console()
    _RICH = True
except Exception:  # pragma: no cover - defensive fallback
    _console = None
    _RICH = False


# (section title, [(target, description), ...]) - wording preserved verbatim
# from the previous `@echo` help blocks so the docs<->code checks stay green.
ROOT_HELP: list[tuple[str, list[tuple[str, str]]]] = [
    ("Setup", [
        ("sync", "uv sync (creates .venv + installs project + dev extras)"),
        ("clean", "drop .venv + build artifacts (preserves state/ and reports/)"),
        ("clean-state", "drop runtime gate state and pgloader logs (preserves audit reports)"),
        ("clean-all", "clean + clean-state + delete parity reports (destructive)"),
        ("clean-reports", "drop regeneratable report artifacts (schema snapshot, reference-data, orphans, run logs, fetch dumps, generated run-markers); preserves committed inputs + rehearsals"),
    ]),
    ("Dev", [
        ("test", "pytest"),
        ("lint", "ruff check"),
        ("typecheck", "ty check"),
        ("sql-fmt", "pg_format the SQL in place (owns all layout + case)"),
        ("sql-fmt-check", "fail if any SQL file is not pg_format-clean"),
        ("sql-lint", "sqlfluff lint (lint-only; never fix)"),
        ("sql-frontmatter", "check every SQL file has its structured front-matter block"),
        ("sql-check", "sql-fmt-check + sql-lint + sql-frontmatter"),
        ("test-db-up", "start throwaway pg_jsonschema Postgres for the deeper-layer SQL harness"),
        ("test-db-down", "remove the throwaway Postgres container"),
        ("spin_up", "start a local target Postgres from .env PG_* vars so init/rebuild run"),
        ("spin_down", "remove the local demos-dev-pg container"),
        ("demonstration-flow-trace",
         "regenerate the live demonstration migration-flow run\n"
         "trace + manifest by replaying the pipeline against a\n"
         "curated fixture on a throwaway Postgres (resolves\n"
         "PG_TEST_DSN like the SQL harness)"),
        ("amendment-flow-trace",
         "regenerate the live amendment migration-flow run\n"
         "trace + manifest by replaying the pipeline against a\n"
         "curated fixture on a throwaway Postgres (resolves\n"
         "PG_TEST_DSN like the SQL harness)"),
    ]),
    ("Build pipeline", [
        ("init ddl load_full seeds crosswalks id_maps",
         "core rebuild order (= make rebuild minus the cutover phases); "
         "chain in one make invocation, or run each on its own"),
        ("init", "migrate init (00_init/)"),
        ("fetch_prisma", "auxiliary, before ddl -- migrate fetch-prisma (fetch + hash-pin the Prisma DDL)"),
        ("fetch_prisma_schema", "auxiliary, before ddl -- migrate fetch-prisma-schema (fetch + hash-pin the .prisma models)"),
        ("verify_prod_schema", "auxiliary, guards ddl -- migrate verify-prod-schema (diff PROD demos_app vs REFERENCE_PG_URL)"),
        ("ddl", "migrate ddl (01_ddl/)"),
        ("load_full", "migrate load-full (pgloader)"),
        ("fk_candidates", "auxiliary, after load_full -- migrate fk-candidates"),
        ("load_fidelity", "auxiliary, after load_full -- migrate load-fidelity (live vs mysql_raw row counts; non-gating)"),
        ("schema_snapshot", "auxiliary, crosswalk input -- migrate schema-snapshot (MySQL information_schema -> reports/)"),
        ("reference_data", "auxiliary, crosswalk input -- migrate reference-data (MySQL *_rfrnc rows + views -> reports/)"),
        ("crosswalk_audit", "auxiliary, after crosswalks -- scripts/crosswalk_audit.py (codebase crosswalks vs live PROD; non-gating, ARGS=--strict)"),
        ("seeds", "migrate seeds (02 + 03)"),
        ("crosswalks", "migrate crosswalks (04)"),
        ("id_maps", "migrate id-maps (05)"),
    ]),
    ("Cutover phases (in order)", [
        ("preflight freeze delta build history constraints parity flip smoke decom",
         "run in order; chain them in one make invocation, or run each on its own"),
        ("resume", "run all remaining"),
        ("rollback", "revert flip"),
        ("status", "show gate state"),
        ("diagnose", "read-only triage report (parity + load-fidelity; no gates)"),
    ]),
    ("Devcontainer load", [
        ("migrate-local",
         "build in a scratch PG (PG_URL) and ship ONLY demos_app into the DEMOS\n"
         "devcontainer (DEVCONTAINER_PG_URL); ARGS passes flags\n"
         "(e.g. ARGS=\"--no-build --skip-jsonschema\"). See\n"
         "runbooks/demos-devcontainer-load.md"),
        ("migrate-local-verify",
         "guard only -- assert the local ../demos migration set matches the\n"
         "pinned Prisma manifest (migrate verify-prisma-local)"),
    ]),
]

DOCS_HELP: list[tuple[str, list[tuple[str, str]]]] = [
    ("Targets", [
        ("install", "bundle install (asciidoctor + extensions)"),
        ("html", "build README.html + every per-page HTML (multi-page docs set)"),
        ("deck", "build the cutover-day Reveal.js deck"),
        ("cli-ref", "regenerate operator/reference-cli.adoc from migrate --help"),
        ("column-map",
         "regenerate reports/generated/source_target_columns_*.adoc\n"
         "fragments from reports/source_target_columns.csv +\n"
         "the MySQL PMDA Graphviz digraph + the DEMOS\n"
         "mermaid model"),
        ("schema-diagrams",
         "regenerate shared/generated/schema-*.adoc partials\n"
         "(mermaid ER clusters, counts attributes, and the\n"
         "static-constraint list) from the Prisma DDL + snapshot"),
        ("schema-drift",
         "diff the generated target model against the legacy\n"
         "DEMOS_Data_Model.mmd (writes reports/schema_drift_report.md)"),
        ("live-partials",
         "render reports/*.md + runbooks/*.md live files into\n"
         "shared/generated/live/*.adoc partials (needs kramdoc)"),
        ("flow-pages",
         "regenerate the static per-table migration-flow partials\n"
         "(shared/generated/<table>-flow-*.adoc for demonstration +\n"
         "amendment: columns, crosswalks, stages) from reports/ +\n"
         "the sql/ stage tree; each live run trace is regenerated by\n"
         "the root <table>-flow-trace target"),
        ("derivability",
         "regenerate shared/generated/derivability-*.adoc\n"
         "fragments (headline, classification, gap verdict,\n"
         "evidence, buckets, proposals) from the Prisma DDL +\n"
         "snapshot + reports/inputs/derivability_verdicts.yaml; fails\n"
         "closed on verdict/gap-set drift"),
        ("data-dictionary",
         "regenerate shared/generated/data-dictionary.adoc\n"
         "from the pinned Prisma DDL + sql/01_ddl_supplements,\n"
         "replaying the migration history so ADD COLUMN / ALTER\n"
         "COLUMN / ADD|DROP CONSTRAINT / CREATE UNIQUE INDEX fold\n"
         "onto the CREATE TABLE blocks"),
        ("prisma-analysis",
         "regenerate shared/generated/prisma-migration-analysis.adoc\n"
         "from the pinned Prisma DDL; classify every migration-\n"
         "relevant statement (CREATE TABLE/SEQUENCE, INSERT, ADD\n"
         "COLUMN, SET/DROP DEFAULT, SET NOT NULL, ADD CHECK,\n"
         "UPDATE backfills, DELETE, trigger toggles)"),
        ("verify", "run all doc<->code consistency checks (fails on drift)"),
        ("verify-schema-refs", "xref / path / demos_app + bare-name checks"),
        ("verify-crosswalks", "crosswalk ids vs seeded constraint rows"),
        ("verify-counts", "committed count attributes vs the model"),
        ("verify-doc-facts", "gate/env/template/makefile/etc tables vs code"),
        ("verify-prisma-analysis", "committed prisma analysis vs the pinned DDL"),
        ("watch", "rebuild html on any *.adoc change (requires entr)"),
        ("all", "cli-ref + column-map + schema-diagrams + flow-pages + data-dictionary + verify + html + deck"),
        ("clean", "remove build/ and .asciidoctor/"),
    ]),
]


@functools.lru_cache(maxsize=1)
def _migrate_commands() -> dict:
    """Map each `migrate` subcommand name to its Click command.

    Built once by introspecting the Typer app so the flag list rendered in
    `make help` is sourced straight from `migration/cli.py` and can never
    drift. Returns {} when the package isn't importable (e.g. before `make
    sync`), so help still renders.
    """
    try:
        import typer

        from migration.cli import app as migrate_app

        group = typer.main.get_command(migrate_app)
        return dict(getattr(group, "commands", {}) or {})
    except Exception:
        return {}


def _target_flags(target: str) -> list[tuple[str, str]]:
    """`(flag, help)` pairs for a make target wrapping `migrate <subcommand>`.

    Make targets are the subcommand name with `_` for `-`. Returns [] for
    targets that take no flags (or aren't migrate-backed).
    """
    try:
        import click
    except Exception:
        return []
    command = _migrate_commands().get(target.replace("_", "-"))
    if command is None:
        return []
    flags: list[tuple[str, str]] = []
    for param in getattr(command, "params", []):
        if not isinstance(param, click.Option):
            continue
        names = "/".join([*param.opts, *param.secondary_opts])
        if names == "--help":
            continue
        flags.append((names, " ".join((param.help or "").split())))
    return flags


def _flags_block(flags: list[tuple[str, str]], label: str):
    """An indented `ARGS:` sub-block for a target's flags (Rich only).

    The flags are dot-leader aligned within the block (independent of the
    target column above) and sit under a dim `<label>` header.
    """
    fwidth = max((len(name) for name, _ in flags), default=0) + 2
    ftable = Table(show_header=False, box=None, pad_edge=False, expand=True)
    ftable.add_column("flag", no_wrap=True)
    ftable.add_column("fhelp", style="white", ratio=1)
    for name, fhelp in flags:
        dots = "." * (fwidth - len(name))
        ftable.add_row(f"[cyan]{name}[/cyan] [dim]{dots}[/dim]", fhelp)
    return Group(Text.from_markup(f"[dim]{label}[/dim]"), Padding(ftable, (0, 0, 0, 4)))


def _print_flags_text(flags: list[tuple[str, str]], label: str) -> None:
    """Plain-text `ARGS:` sub-block (Rich-free fallback)."""
    if not flags:
        return
    print(f"      {label}")
    fwidth = max((len(name) for name, _ in flags), default=0) + 2
    for name, fhelp in flags:
        dots = "." * (fwidth - len(name))
        print(f"          {name} {dots} {fhelp}")


def _render_help(sections: list[tuple[str, list[tuple[str, str]]]]) -> None:
    if not _RICH:
        for title, rows in sections:
            print(f"\n{title}:")
            for target, desc in rows:
                if " " in target:  # ordered phase list, not a single target
                    print(f"  {target}")
                    if desc:
                        print(f"    {desc}")
                    for phase in target.split():
                        _print_flags_text(_target_flags(phase), f"{phase} ARGS:")
                else:
                    print(f"  {target:<18}{desc}")
                    _print_flags_text(_target_flags(target), "ARGS:")
        return
    for title, rows in sections:
        # Dot-leader width is shared across every single-target row in the
        # section so the descriptions line up.
        leaders = [(t, d) for t, d in rows if " " not in t]
        width = max((len(t) for t, _ in leaders), default=0) + 2
        body: list = []
        table = None
        for target, desc in rows:
            if " " in target:
                # A space-separated "target" is really an ordered list of phase
                # targets. Render them as a cyan chain joined by dim arrows
                # (so they read as runnable commands, not a description) with
                # the desc as a dim-italic invocation hint, instead of one
                # no-wrap column that would crush the rest of the panel.
                table = None
                chain = " [dim]\u2192[/dim] ".join(
                    f"[bold cyan]{p}[/bold cyan]" for p in target.split())
                body.append(Text.from_markup(chain))
                if desc:
                    body.append(Text.from_markup(f"[dim italic]{desc}[/dim italic]"))
                # A phase in the chain may still take flags (e.g. parity);
                # render each such phase its own `<phase> ARGS:` block.
                for phase in target.split():
                    pflags = _target_flags(phase)
                    if pflags:
                        body.append(Padding(_flags_block(pflags, f"{phase} ARGS:"), (0, 0, 0, 4)))
            else:
                if table is None:
                    table = Table(show_header=False, box=None, pad_edge=False, expand=True)
                    table.add_column("target", no_wrap=True)
                    table.add_column("desc", style="white", ratio=1)
                    body.append(table)
                dots = "." * (width - len(target))
                table.add_row(f"[bold cyan]{target}[/bold cyan] [dim]{dots}[/dim]", desc)
                flags = _target_flags(target)
                if flags:
                    # An indented `ARGS:` block under the target. Its own table
                    # keeps the (potentially long) flag column from widening and
                    # misaligning the target rows above; the trailing reset
                    # starts a fresh target table below the block.
                    body.append(Padding(_flags_block(flags, "ARGS:"), (0, 0, 0, 4)))
                    table = None
        inner = body[0] if len(body) == 1 else Group(*body)
        _console.print(Panel(inner, title=f"[bold]{title}[/bold]",
                             border_style="cyan", title_align="left"))


def _run(label: str, command: str) -> int:
    if _RICH:
        _console.rule(f"[bold cyan]\u25b6 {label}[/bold cyan]", align="left")
    else:
        print(f">> {label}")
    result = subprocess.run(command, shell=True)
    code = result.returncode
    if _RICH:
        if code == 0:
            _console.print(Panel(Text(f"\u2713 {label}", style="bold green"),
                                 border_style="green", expand=False))
        else:
            _console.print(Panel(Text(f"\u2717 {label} (exit {code})", style="bold red"),
                                 border_style="red", expand=False))
    else:
        print(f"{'OK' if code == 0 else 'FAIL'}: {label} (exit {code})")
    return code


def _msg(text: str) -> None:
    if _RICH:
        _console.print(Panel(Text(text, style="bold green"),
                             border_style="green", expand=False))
    else:
        print(text)


def main(argv: list[str]) -> int:
    if not argv:
        print("usage: mk_pretty.py {help|run|msg} ...", file=sys.stderr)
        return 2
    cmd, rest = argv[0], argv[1:]
    if cmd == "help":
        which = rest[0] if rest else "root"
        _render_help(DOCS_HELP if which == "docs" else ROOT_HELP)
        if which != "docs":
            hint = 'Pass command flags via ARGS, e.g. make fetch_prisma ARGS="--refresh"'
            _console.print(f"[dim]{hint}[/dim]") if _RICH else print(hint)
        return 0
    if cmd == "run":
        if len(rest) < 2:
            print("usage: mk_pretty.py run <label> <command...>", file=sys.stderr)
            return 2
        return _run(rest[0], " ".join(rest[1:]))
    if cmd == "msg":
        _msg(" ".join(rest))
        return 0
    print(f"unknown subcommand: {cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
