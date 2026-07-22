"""C/Wednesday-Week-1: full MySQL -> mysql_raw load via pgloader, applying drop list."""

from __future__ import annotations

from migration.lib import (
    PGLOADER_DIR,
    RUNS_DIR,
    STATE_DIR,
    Env,
    assert_pgloader_ok,
    cast_block,
    die,
    excluding_block,
    file_stamp,
    log,
    mark_gate,
    pgloader_argv,
    progress_spinner,
    rel,
    render_template,
    require_pgloader,
    require_schema,
    run_teed,
)


def run_load_full() -> None:
    """Run the initial full pgloader MySQL -> ``mysql_raw`` load.

    Requires the ``mysql_raw`` schema to already exist. Renders
    ``schema.load`` with the connection strings and the drop-list
    EXCLUDING block, invokes pgloader with output captured to
    ``reports/runs/pgloader_run_<stamp>.log``, and marks the ``load_full`` gate.
    """
    env = Env.load()
    require_pgloader(env)
    require_schema(env, "mysql_raw")

    template = PGLOADER_DIR / "schema.load"
    if not template.exists():
        die(f"missing {template}")

    rendered = STATE_DIR / "schema.rendered.load"
    rendered.parent.mkdir(exist_ok=True)
    render_template(
        template,
        rendered,
        {
            "MYSQL_URL": env.mysql_url,
            "PG_URL": env.pg_url_pgloader(),
            "MYSQL_DB": env.mysql_db,
            "CAST_BLOCK": cast_block(),
            "EXCLUDING_BLOCK": excluding_block(),
        },
    )

    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    log_file = RUNS_DIR / f"pgloader_run_{file_stamp()}.log"
    log(f"running pgloader; output: {rel(log_file)}")
    with progress_spinner("pgloader") as sp:
        run_teed(
            pgloader_argv(rendered, env),
            log_file,
            on_line=lambda line: sp.note(f"pgloader: {line}") if line.strip() else None,
        )
    assert_pgloader_ok(log_file)

    mark_gate("load_full")
