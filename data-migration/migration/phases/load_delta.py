"""P2: cutover delta load via pgloader.

Semantics: this phase runs *after* MySQL writes are frozen. It re-pulls
every table named in pgloader/delta_tables.tsv with TRUNCATE FIRST, so
mysql_raw is the post-freeze snapshot. There is no per-row WHERE cutoff
because the freeze itself is the cutoff; if writes are not actually
paused the operator should hold (see the `delta` gate in the runbook).
"""

from __future__ import annotations

import csv
import re
from pathlib import Path

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
    pgloader_argv,
    phase,
    rel,
    render_template,
    require_pgloader,
    run,
)

DELTA_TABLES_TSV = PGLOADER_DIR / "delta_tables.tsv"
_FREEZE_INSTANT_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


def _validate_freeze_instant(s: str) -> str:
    """Return ``s`` unchanged when it matches ``YYYY-MM-DDTHH:MM:SSZ``; else die.

    Guards against SQL/template injection through the freeze-instant
    value, which is interpolated directly into the rendered pgloader
    config and into the ``_delta_log`` insert.
    """
    if not _FREEZE_INSTANT_RE.match(s):
        die(
            f"freeze_instant {s!r} does not match YYYY-MM-DDTHH:MM:SSZ; "
            "refusing to interpolate into SQL/pgloader template"
        )
    return s


def _read_delta_tables(path: Path = DELTA_TABLES_TSV) -> list[str]:
    """Return table names from the TSV manifest; empty list if missing."""
    if not path.exists():
        log(f"no delta manifest at {path}; nothing to delta-load")
        return []
    names: list[str] = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            tbl = row["table_name"].strip()
            if not tbl or tbl.startswith("#"):
                continue
            names.append(tbl)
    return names


def _build_tables_block(table_names: list[str]) -> str:
    """Emit pgloader's `INCLUDING ONLY TABLE NAMES MATCHING ...` for the manifest.

    Returns an empty string when the manifest is empty so the rendered
    template falls through to pgloader's default (load every table the
    schema clause exposes).
    """
    if not table_names:
        return ""
    quoted = ", ".join(f"'{t}'" for t in table_names)
    return f"INCLUDING ONLY TABLE NAMES MATCHING {quoted}"


@phase("delta", requires="freeze")
def run_load_delta() -> None:
    """Run P2: pgloader delta load from the frozen MySQL into ``mysql_raw``.

    Requires the ``freeze`` gate. Reads the validated freeze instant
    from ``state/freeze_instant.txt``, renders ``delta.tmpl.load`` with
    the connection strings and table manifest, invokes pgloader with
    output streamed to ``reports/runs/pgloader_delta_<stamp>.log``, and marks
    the ``delta`` gate.
    """
    env = Env.load()
    require_pgloader(env)

    freeze_file = STATE_DIR / "freeze_instant.txt"
    if not freeze_file.exists():
        die("no freeze_instant.txt; run freeze first")
    freeze_instant = _validate_freeze_instant(freeze_file.read_text(encoding="utf-8").strip())

    template = PGLOADER_DIR / "delta.tmpl.load"
    if not template.exists():
        die(f"missing {template}")
    rendered = STATE_DIR / "delta.rendered.load"
    render_template(
        template,
        rendered,
        {
            "MYSQL_URL": env.mysql_url,
            "PG_URL": env.pg_url_pgloader(),
            "MYSQL_DB": env.mysql_db,
            "CAST_BLOCK": cast_block(),
            "FREEZE_INSTANT": freeze_instant,
            "TABLES_BLOCK": _build_tables_block(_read_delta_tables()),
            "EXCLUDING_BLOCK": excluding_block(),
        },
    )

    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    log_file: Path = RUNS_DIR / f"pgloader_delta_{file_stamp()}.log"
    log(f"running pgloader delta; freeze={freeze_instant}; output: {rel(log_file)}")
    with log_file.open("w", encoding="utf-8") as out:
        run(pgloader_argv(rendered, env), stdout=out, stderr=out)
    assert_pgloader_ok(log_file)
