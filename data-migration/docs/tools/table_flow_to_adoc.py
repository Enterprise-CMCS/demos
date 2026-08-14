"""Generate the static AsciiDoc partials for a per-table migration-flow page.

Offline companion to ``docs/tools/table_flow_trace.py`` (the live run trace).
For a table it emits three committed partials under ``docs/shared/generated/``,
all derived from authoritative repo artifacts so they cannot drift silently:

* ``<table>-flow-columns.adoc``    -- the source->target column contract, the
  rows of ``reports/source_target_columns.csv`` whose DEMOS table is the
  target. (Loader-computed constants/derivations that have no 1:1 source row
  -- application_type_id, signature_level_id, current_phase_id, chip_id -- are
  covered by the page prose and shown concretely in the live run trace.)
* ``<table>-flow-crosswalks.adoc`` -- the value tables of each crosswalk the
  flow uses, read verbatim from ``reports/crosswalks/<name>.csv``.
* ``<table>-flow-stages.adoc``     -- the ordered SQL stage files that
  implement the flow, each path existence-checked (fail-closed) so a renamed
  or removed stage fails the generator instead of leaving a stale doc.

Run from the repo root (the docs Makefile ``flow-pages`` target does this):

    uv run python docs/tools/table_flow_to_adoc.py --table demonstration

Lints (hard failures, exit 1): the target table has at least one column-map
row; every referenced crosswalk CSV exists; every stage SQL path exists.
"""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SQL_DIR = REPO_ROOT / "sql"
REPORTS_DIR = REPO_ROOT / "reports"
SOURCE_TARGET_CSV = REPORTS_DIR / "source_target_columns.csv"
CROSSWALK_DIR = REPORTS_DIR / "crosswalks"
OUT_DIR = REPO_ROOT / "docs" / "shared" / "generated"


@dataclass(frozen=True)
class TableFlowConfig:
    table: str
    target_table: str
    source_anchor: str
    crosswalks: list[tuple[str, str]]
    stages: list[tuple[str, str]]


CONFIGS: dict[str, TableFlowConfig] = {
    "demonstration": TableFlowConfig(
        table="demonstration",
        target_table="demonstration",
        source_anchor="mdcd_demo",
        crosswalks=[
            ("demo_status (mdcd_demo_stus_cd -> demonstration.status_id)", "demo_status"),
            ("sdg_division (mdcd_chip_div_cd -> demonstration.sdg_division_id)", "sdg_division"),
        ],
        stages=[
            ("sql/10_stg/10_filter_demo.sql",
             "Filter: PMDA project-number / state / date allowlist (`stg._valid_demo_ids`)"),
            ("sql/05_id_maps/10_mdcd_demo.sql",
             "Create the legacy-id -> UUID map table (`migration._id_map_mdcd_demo`)"),
            ("sql/10_stg/18_populate_id_map_mdcd_demo.sql",
             "Mint one UUID per PMDA-valid id (`ON CONFLICT DO NOTHING`, stable across reruns)"),
            ("sql/10_stg/22_demonstration_resolved.sql",
             "Source-only projection + date-driven phase (`stg.demonstration_resolved`)"),
            ("sql/04_crosswalks/10_demo_status.sql",
             "Status crosswalk table (codes 1-9 mapped; code 1 'Pending' -> 'Under Review')"),
            ("sql/04_crosswalks/62_sdg_division.sql",
             "SDG division crosswalk table (legacy sentinel 0 -> NULL)"),
            ("sql/20_app/30_demonstration.sql",
             "Load `application` anchor + `demonstration`; hold-backs; chip-id mint"),
            ("sql/99_parity/10_demonstration_id_provenance.sql",
             "Parity 6: every `demonstration.id` traces to a PMDA legacy row"),
            ("sql/99_parity/11_demonstration_completeness.sql",
             "Parity 8: resolved demonstrations the loader could not place"),
            ("sql/99_parity/12_approved_demo_held_for_division.sql",
             "Parity 13: Approved demonstrations held back for a missing required field"),
        ],
    ),
    "amendment": TableFlowConfig(
        table="amendment",
        target_table="amendment",
        source_anchor="mdcd_demo_amndmt",
        crosswalks=[
            ("amendment_status (mdcd_demo_amndmt_stus_cd -> amendment.status_id)",
             "amendment_status"),
        ],
        stages=[
            ("sql/10_stg/13_filter_amndmt.sql",
             "Filter: keep amendments whose approved or pending parent survives "
             "(`stg._valid_amndmt_ids`)"),
            ("sql/05_id_maps/16_mdcd_demo_amndmt.sql",
             "Create the legacy-id -> UUID map table (`migration._id_map_mdcd_demo_amndmt`)"),
            ("sql/10_stg/29_populate_id_map_mdcd_demo_amndmt.sql",
             "Mint one shared UUID per PMDA-valid amendment id (`ON CONFLICT DO NOTHING`)"),
            ("sql/10_stg/30_amendment_resolved.sql",
             "Source-only projection (`stg.amendment_resolved`); soft-deletes dropped"),
            ("sql/04_crosswalks/64_amendment_status.sql",
             "Status crosswalk table (1->Under Review, 2->Approved, 3->Withdrawn, 4->Denied)"),
            ("sql/20_app/35_amendment.sql",
             "Load `application` anchor + `amendment`; parent hold-backs; signature/phase derivation"),
            ("sql/99_parity/52_amendment_load.sql",
             "Parity 19: amendment load accounting (held / signature-dropped / phase tally)"),
        ],
    ),
}

ADOC_NOTICE = (
    "// Generated by docs/tools/table_flow_to_adoc.py --table {table}.\n"
    "// Do not edit by hand; rerun `make flow-pages` from docs/.\n"
)


def die(msg: str) -> None:
    print(f"[table_flow_to_adoc] FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def _esc(s: str) -> str:
    return (s or "").replace("|", "\\|")


def _load_column_rows(target_table: str) -> list[dict[str, str]]:
    if not SOURCE_TARGET_CSV.exists():
        die(f"missing {SOURCE_TARGET_CSV}")
    rows: list[dict[str, str]] = []
    with SOURCE_TARGET_CSV.open(encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            if (row.get("demos_table") or "").strip() == target_table:
                rows.append({k: (v or "").strip() for k, v in row.items()})
    return rows


def render_columns(cfg: TableFlowConfig) -> str:
    rows = _load_column_rows(cfg.target_table)
    if not rows:
        die(
            f"no rows in {SOURCE_TARGET_CSV.name} target demos table "
            f"'{cfg.target_table}'"
        )
    out = [ADOC_NOTICE.format(table=cfg.table), ""]
    out.append(
        f"The source->target column contract for `demos_app.{cfg.target_table}` "
        f"(anchored on `mysql_raw.{cfg.source_anchor}`), from "
        "`reports/source_target_columns.csv`:"
    )
    out += [
        "",
        '[%header%autowidth.stretch]',
        "|===",
        "| MySQL column | DEMOS column | Transform | Notes",
        "",
    ]
    for r in rows:
        out.append(
            "| `{mc}` | `{dc}` | `{tr}` | {nt}".format(
                mc=_esc(r["mysql_column"]),
                dc=_esc(r["demos_column"]),
                tr=_esc(r["transform"]),
                nt=_esc(r["notes"]),
            )
        )
    out += ["|===", ""]
    return "\n".join(out)


def render_crosswalks(cfg: TableFlowConfig) -> str:
    out = [ADOC_NOTICE.format(table=cfg.table), ""]
    for title, name in cfg.crosswalks:
        path = CROSSWALK_DIR / f"{name}.csv"
        if not path.exists():
            die(f"crosswalk CSV missing: {path}")
        with path.open(encoding="utf-8", newline="") as fh:
            reader = csv.reader(fh)
            header = next(reader, None)
            if header is None:
                die(f"crosswalk CSV has no header: {path}")
            body = [r for r in reader if r and any(c.strip() for c in r)]
        out.append(f".{_esc(title)}")
        out.append('[%header%autowidth.stretch]')
        out.append("|===")
        out.append("| " + " | ".join(_esc(h) for h in header))
        out.append("")
        for r in body:
            cells = [(c.strip() or "(NULL)") for c in r]
            out.append("| " + " | ".join(_esc(c) for c in cells))
        out += ["|===", ""]
    return "\n".join(out)


def render_stages(cfg: TableFlowConfig) -> str:
    out = [ADOC_NOTICE.format(table=cfg.table), ""]
    out.append(
        "The ordered SQL files that implement the flow. Each path is "
        "existence-checked by the generator, so a renamed or removed stage "
        "fails `make flow-pages` instead of leaving this list stale:"
    )
    out += [
        "",
        '[%header%autowidth.stretch]',
        "|===",
        "| # | SQL file | Role",
        "",
    ]
    for i, (relpath, role) in enumerate(cfg.stages, 1):
        if not (REPO_ROOT / relpath).exists():
            die(f"stage SQL missing: {relpath}")
        out.append(f"| {i} | `{_esc(relpath)}` | {role}")
    out += ["|===", ""]
    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    p.add_argument("--table", default="demonstration", choices=sorted(CONFIGS))
    p.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = p.parse_args(argv)

    cfg = CONFIGS[args.table]
    args.out_dir.mkdir(parents=True, exist_ok=True)

    artifacts = {
        f"{cfg.table}-flow-columns.adoc": render_columns(cfg),
        f"{cfg.table}-flow-crosswalks.adoc": render_crosswalks(cfg),
        f"{cfg.table}-flow-stages.adoc": render_stages(cfg),
    }
    for name, text in artifacts.items():
        (args.out_dir / name).write_text(text, encoding="utf-8")

    try:
        where = args.out_dir.resolve().relative_to(REPO_ROOT)
    except ValueError:
        where = args.out_dir
    print(
        f"[table_flow_to_adoc] wrote {len(artifacts)} partials to "
        f"{where} for table '{cfg.table}'."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
