"""Verify hand-authored documentation facts still match the code they describe.

Run from the repo root via ``make verify-doc-facts`` (in ``docs/``):

    cd .. && uv run python docs/tools/verify_doc_facts.py

Unlike the schema generators (which *emit* committed partials), several
reference pages carry tables/lists that are hand-maintained yet mirror a
concrete code fact: the gate graph, the pgloader template markers, the
environment variables, the package surface, the Makefile targets, the
pipeline stage directories, the JSONB schema registry, and the PMDA
project-number regex. Each check below re-derives the fact from code and
asserts the prose agrees, so a stale page fails ``make all`` instead of
silently misleading a reader.

Every check returns a list of human-readable problems; ``main`` runs them
all, prints a per-check ``OK``/``FAIL`` line, and exits non-zero if any
check found a problem.
"""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

from schema_model import DOCS_DIR, REPO_ROOT

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #

LIB_PY = REPO_ROOT / "migration" / "lib.py"
CLI_PY = REPO_ROOT / "migration" / "cli.py"
PHASES_DIR = REPO_ROOT / "migration" / "phases"
PGLOADER_DIR = REPO_ROOT / "pgloader"
SQL_DIR = REPO_ROOT / "sql"
ROOT_MAKEFILE = REPO_ROOT / "Makefile"
DOCS_MAKEFILE = DOCS_DIR / "Makefile"
MK_PRETTY = REPO_ROOT / "scripts" / "mk_pretty.py"
JSONB_SCHEMAS_DIR = REPO_ROOT / "reports" / "jsonb_schemas"

GATES_DOC = DOCS_DIR / "operator" / "reference-gates-state.adoc"
ENV_DOC = DOCS_DIR / "operator" / "reference-environment.adoc"
MAKEFILE_DOC = DOCS_DIR / "operator" / "reference-makefile.adoc"
REHEARSAL_DOC = DOCS_DIR / "operator" / "reference-rehearsal-commands.adoc"
HUMAN_INPUTS_DOC = DOCS_DIR / "operator" / "reference-human-inputs.adoc"
TEMPLATES_DOC = DOCS_DIR / "developer" / "reference-templates.adoc"
PACKAGE_DOC = DOCS_DIR / "developer" / "reference-python-package.adoc"
JSONB_DOC = DOCS_DIR / "developer" / "reference-jsonb-schema-registry.adoc"
ID_MAPS_DOC = DOCS_DIR / "developer" / "reference-id-maps.adoc"
STAGE_MAP_DOC = DOCS_DIR / "shared" / "pipeline-stage-map.adoc"

FILTER_SQL = [
    SQL_DIR / "10_stg" / "10_filter_demo.sql",
    SQL_DIR / "10_stg" / "11_filter_pendg_demo.sql",
    SQL_DIR / "10_stg" / "12_filter_aplctn.sql",
    SQL_DIR / "10_stg" / "99_filter_report.sql",
]

# Vars documented in reference-environment.adoc that are read straight from
# os.environ rather than declared on migration.lib.Env (flip.py reads
# NEW_APP_HEALTHZ_URL; lib.confirm reads MIGRATE_NONINTERACTIVE).
ALLOWED_NON_ENV_VARS = {"MIGRATE_NONINTERACTIVE"}

# Public lib.py names intentionally absent from the package-surface catalog
# (low-level helpers / typing vars). New public symbols NOT listed here must
# appear in the doc table, which is the point of the check.
ALLOWED_UNDOCUMENTED_LIB = {
    "P",
    "R",
    "ensure_dirs",
    "gate_path",
    "rel",
    "INIT_SCHEMAS_SQL",
    "SCHEMA_SNAPSHOT_DIR",
    "REFERENCE_DATA_DIR",
}

TEMPLATE_FILES = ("schema.load", "delta.tmpl.load")

# --------------------------------------------------------------------------- #
# Generic helpers
# --------------------------------------------------------------------------- #

_MARKER_RE = re.compile(r"\{\{(\w+)\}\}")
_TRANSITION_RE = re.compile(r"(\[\*\]|\w+)\s*-->\s*(\[\*\]|\w+)")
_GATE_OK_RE = re.compile(r"state/([a-z_]+)\.ok")
_ENV_ROW_RE = re.compile(r"^\|\s*`([A-Z][A-Z0-9_]*)`")
_PHASE_PATH_RE = re.compile(r"migration/phases/(\w+)\.py")
_MAKE_TARGET_RE = re.compile(r"\bmake ([a-z][a-z0-9_-]*)")
_MIGRATE_CMD_RE = re.compile(r"\bmigrate ([a-z][a-z0-9-]*)")
_REGEX_LITERAL_RE = re.compile(r"!~\s*'([^']*11-W-[^']*)'")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _parse(path: Path) -> ast.Module:
    return ast.parse(_read(path))


def _section(text: str, heading: str) -> str:
    """Return the body of an AsciiDoc ``== Heading`` block (until the next ``== ``)."""
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if line.strip() == heading:
            start = i + 1
            break
    if start is None:
        return ""
    out: list[str] = []
    for line in lines[start:]:
        if line.strip().startswith("== "):
            break
        out.append(line)
    return "\n".join(out)


def _str_or_tuple(node: ast.expr) -> list[str]:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return [node.value]
    if isinstance(node, ast.Tuple):
        return [e.value for e in node.elts if isinstance(e, ast.Constant) and isinstance(e.value, str)]
    return []


# --------------------------------------------------------------------------- #
# 1. PMDA project-number regex
# --------------------------------------------------------------------------- #


def check_regex() -> list[str]:
    problems: list[str] = []
    found: dict[str, list[str]] = {}
    for sql in FILTER_SQL:
        if not sql.exists():
            problems.append(f"missing filter SQL file: {sql.relative_to(REPO_ROOT)}")
            continue
        for rx in _REGEX_LITERAL_RE.findall(_read(sql)):
            found.setdefault(rx, []).append(sql.name)
    if not found:
        return [*problems, "no PMDA project-number regex found in the filter SQL files"]
    if len(found) > 1:
        problems.append(f"filter SQL files disagree on the PMDA regex: {found}")
    canonical = max(found, key=lambda k: len(found[k]))
    if not ID_MAPS_DOC.exists():
        return [*problems, f"missing {ID_MAPS_DOC.relative_to(REPO_ROOT)}"]
    if canonical not in _read(ID_MAPS_DOC):
        problems.append(
            f"reference-id-maps.adoc does not cite the canonical PMDA regex `{canonical}`"
        )
    return problems


# --------------------------------------------------------------------------- #
# 2. Gate graph
# --------------------------------------------------------------------------- #


def _phases_tuple() -> list[str]:
    for node in _parse(LIB_PY).body:
        target_is_phases = (
            isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.target.id == "PHASES"
        ) or (
            isinstance(node, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id == "PHASES" for t in node.targets)
        )
        if target_is_phases and isinstance(node.value, ast.Tuple):
            return [
                e.value
                for e in node.value.elts
                if isinstance(e, ast.Constant) and isinstance(e.value, str)
            ]
    return []


def _phase_decorator_edges() -> set[tuple[str, str]]:
    edges: set[tuple[str, str]] = set()
    for py in sorted(PHASES_DIR.glob("*.py")):
        for node in ast.walk(_parse(py)):
            if not isinstance(node, ast.FunctionDef):
                continue
            for dec in node.decorator_list:
                if not (isinstance(dec, ast.Call) and isinstance(dec.func, ast.Name) and dec.func.id == "phase"):
                    continue
                if not (dec.args and isinstance(dec.args[0], ast.Constant)):
                    continue
                name = dec.args[0].value
                if not isinstance(name, str):
                    continue
                for kw in dec.keywords:
                    if kw.arg == "requires":
                        for req in _str_or_tuple(kw.value):
                            edges.add((req, name))
    return edges


def _manual_gate_edges() -> set[tuple[str, str]]:
    edges: set[tuple[str, str]] = set()
    for py in (PHASES_DIR / "build.py", PHASES_DIR / "parity.py"):
        if not py.exists():
            continue
        for node in ast.walk(_parse(py)):
            if not isinstance(node, ast.FunctionDef):
                continue
            requires: list[str] = []
            marks: list[str] = []
            for sub in ast.walk(node):
                if not (isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name)):
                    continue
                if not (sub.args and isinstance(sub.args[0], ast.Constant)):
                    continue
                gate = sub.args[0].value
                if not isinstance(gate, str):
                    continue
                if sub.func.id == "require_gate":
                    requires.append(gate)
                elif sub.func.id == "mark_gate":
                    marks.append(gate)
            for req in requires:
                for mark in marks:
                    edges.add((req, mark))
    return edges


def check_gates() -> list[str]:
    problems: list[str] = []
    phases = _phases_tuple()
    if not phases:
        return ["could not parse PHASES tuple from migration/lib.py"]
    idx = {p: i for i, p in enumerate(phases)}

    for src, tgt in sorted(_phase_decorator_edges() | _manual_gate_edges()):
        if src not in idx or tgt not in idx:
            problems.append(f"gate edge references unknown phase: {src} -> {tgt}")
        elif idx[tgt] != idx[src] + 1:
            problems.append(f"gate requires-edge {src} -> {tgt} is not consecutive in PHASES")

    if not GATES_DOC.exists():
        return [*problems, f"missing {GATES_DOC.relative_to(REPO_ROOT)}"]
    text = _read(GATES_DOC)

    doc_ok: list[str] = []
    for name in _GATE_OK_RE.findall(_section(text, "== Gate files")):
        if name in idx and name not in doc_ok:
            doc_ok.append(name)
    if doc_ok != phases:
        problems.append(f"gate-file table order {doc_ok} != PHASES order {phases}")

    for a, b in _TRANSITION_RE.findall(_section(text, "== Gate state lifecycle")):
        pa = a[:-3] if a.endswith("_ok") else None
        pb = b[:-3] if b.endswith("_ok") else None
        if pa in idx and pb in idx and idx[pb] != idx[pa] + 1:
            problems.append(f"state-diagram transition {a} -> {b} is not consecutive in PHASES")
    return problems


# --------------------------------------------------------------------------- #
# 3. pgloader template markers
# --------------------------------------------------------------------------- #


def _code_template_markers() -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    for fname in TEMPLATE_FILES:
        p = PGLOADER_DIR / fname
        out[fname] = set(_MARKER_RE.findall(_read(p))) if p.exists() else set()
    return out


def _doc_template_markers() -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    for line in _section(_read(TEMPLATES_DOC), "== Markers").splitlines():
        markers = _MARKER_RE.findall(line)
        if not markers:
            continue
        out[markers[0]] = {f for f in TEMPLATE_FILES if f in line}
    return out


def check_templates() -> list[str]:
    problems: list[str] = []
    if not TEMPLATES_DOC.exists():
        return [f"missing {TEMPLATES_DOC.relative_to(REPO_ROOT)}"]

    code = _code_template_markers()
    code_inv: dict[str, set[str]] = {}
    for fname, markers in code.items():
        for m in markers:
            code_inv.setdefault(m, set()).add(fname)

    doc = _doc_template_markers()
    for marker, files in sorted(code_inv.items()):
        if marker not in doc:
            problems.append(
                f"template marker {{{{{marker}}}}} (used in {sorted(files)}) "
                "is undocumented in reference-templates.adoc"
            )
        elif doc[marker] != files:
            problems.append(
                f"template marker {{{{{marker}}}}} 'Used in' lists {sorted(doc[marker])} "
                f"but the templates actually use it in {sorted(files)}"
            )
    for marker in sorted(doc):
        if marker not in code_inv:
            problems.append(
                f"reference-templates.adoc documents marker {{{{{marker}}}}} "
                "that no pgloader template uses"
            )

    # Secondary: the gates page also names the rendered-template markers.
    if GATES_DOC.exists():
        rendered = _section(_read(GATES_DOC), "== Rendered pgloader templates")
        for marker in sorted(set(_MARKER_RE.findall(rendered))):
            if marker not in code_inv:
                problems.append(
                    f"reference-gates-state.adoc references marker {{{{{marker}}}}} "
                    "that no pgloader template uses"
                )
    return problems


# --------------------------------------------------------------------------- #
# 4. Pipeline stage -> directory map
# --------------------------------------------------------------------------- #


def check_stage_map() -> list[str]:
    if not STAGE_MAP_DOC.exists():
        return [f"missing {STAGE_MAP_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    actual = {p.name for p in SQL_DIR.iterdir() if p.is_dir()}
    referenced = set(re.findall(r"sql/(\w+)/", _read(STAGE_MAP_DOC)))
    for missing in sorted(actual - referenced):
        problems.append(f"pipeline-stage-map.adoc omits sql/ stage directory `{missing}`")
    for extra in sorted(referenced - actual):
        problems.append(f"pipeline-stage-map.adoc references nonexistent sql/ directory `{extra}`")
    return problems


# --------------------------------------------------------------------------- #
# 5. Environment variables
# --------------------------------------------------------------------------- #


def _env_fields() -> dict[str, tuple[bool, object | None]]:
    fields: dict[str, tuple[bool, object | None]] = {}
    for node in ast.walk(_parse(LIB_PY)):
        if not (isinstance(node, ast.ClassDef) and node.name == "Env"):
            continue
        for stmt in node.body:
            if isinstance(stmt, ast.AnnAssign) and isinstance(stmt.target, ast.Name):
                name = stmt.target.id
                if name == "model_config" or name.startswith("_"):
                    continue
                default = stmt.value.value if isinstance(stmt.value, ast.Constant) else None
                fields[name] = (stmt.value is not None, default)
    return fields


def check_env() -> list[str]:
    if not ENV_DOC.exists():
        return [f"missing {ENV_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    fields = _env_fields()
    section = _section(_read(ENV_DOC), "== Loaded variables")

    rows: dict[str, str] = {}
    for line in section.splitlines():
        m = _ENV_ROW_RE.match(line)
        if m:
            rows[m.group(1)] = line

    for name, (has_default, default) in fields.items():
        var = name.upper()
        row = rows.get(var)
        if row is None:
            problems.append(f"Env field `{name}` ({var}) is not documented in reference-environment.adoc")
            continue
        cells = [c.strip() for c in row.split("|")]
        required_cell = cells[2].lower() if len(cells) > 2 else ""
        if not has_default and not required_cell.startswith("yes"):
            problems.append(f"`{var}` is required (no default in Env) but the doc marks it '{required_cell}'")
        if has_default and isinstance(default, str) and default and default not in row:
            problems.append(f"`{var}` default `{default}` is not shown in its reference-environment.adoc row")

    documented_env = {v for v in rows if v not in ALLOWED_NON_ENV_VARS}
    field_uppers = {n.upper() for n in fields}
    for var in sorted(documented_env - field_uppers):
        problems.append(f"reference-environment.adoc documents `{var}` which is not an Env field")
    return problems


# --------------------------------------------------------------------------- #
# 6. Python package surface
# --------------------------------------------------------------------------- #


def _public_lib_symbols() -> set[str]:
    out: set[str] = set()
    for node in _parse(LIB_PY).body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            if not node.name.startswith("_"):
                out.add(node.name)
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if not node.target.id.startswith("_"):
                out.add(node.target.id)
        elif isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and not t.id.startswith("_"):
                    out.add(t.id)
    return out


def check_package() -> list[str]:
    if not PACKAGE_DOC.exists():
        return [f"missing {PACKAGE_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    text = _read(PACKAGE_DOC)

    modules = {p.stem for p in PHASES_DIR.glob("*.py") if p.name != "__init__.py"}
    for mod in sorted(modules):
        if f"migration/phases/{mod}.py" not in text:
            problems.append(f"migration/phases/{mod}.py is undocumented in reference-python-package.adoc")
    for mod in sorted(set(_PHASE_PATH_RE.findall(text))):
        if not (PHASES_DIR / f"{mod}.py").exists():
            problems.append(f"reference-python-package.adoc lists migration/phases/{mod}.py which does not exist")

    for sym in sorted(_public_lib_symbols() - ALLOWED_UNDOCUMENTED_LIB):
        if not re.search(rf"\b{re.escape(sym)}\b", text):
            problems.append(f"lib.py public symbol `{sym}` is undocumented in reference-python-package.adoc")
    return problems


# --------------------------------------------------------------------------- #
# 7. Makefile targets
# --------------------------------------------------------------------------- #


def _phony_targets(makefile: Path = ROOT_MAKEFILE) -> set[str]:
    targets: set[str] = set()
    collecting = False
    for line in _read(makefile).splitlines():
        if line.startswith(".PHONY:"):
            content = line[len(".PHONY:") :]
            collecting = True
        elif collecting:
            content = line
        else:
            continue
        more = content.rstrip().endswith("\\")
        targets.update(content.rstrip().rstrip("\\").split())
        collecting = more
    return targets


def _docs_help_targets() -> set[str]:
    """Target names catalogued in ``DOCS_HELP`` (the ``make help`` Rich panel).

    The docs/Makefile has no ``reference-*.adoc`` page; its target catalog is
    the ``DOCS_HELP`` table in ``scripts/mk_pretty.py`` that ``make help``
    renders. Parsed via ``ast`` so a new target with no help row (or a help row
    naming no target) fails the check.
    """
    tree = ast.parse(_read(MK_PRETTY))
    for node in tree.body:
        target = node.target if isinstance(node, ast.AnnAssign) else (
            node.targets[0] if isinstance(node, ast.Assign) and node.targets else None
        )
        if isinstance(target, ast.Name) and target.id == "DOCS_HELP" and node.value is not None:
            sections = ast.literal_eval(node.value)
            return {row[0] for _title, rows in sections for row in rows}
    return set()


def check_makefile() -> list[str]:
    problems: list[str] = []

    # Root Makefile <-> operator/reference-makefile.adoc.
    if not MAKEFILE_DOC.exists():
        problems.append(f"missing {MAKEFILE_DOC.relative_to(REPO_ROOT)}")
    else:
        phony = _phony_targets(ROOT_MAKEFILE)
        documented = set(_MAKE_TARGET_RE.findall(_read(MAKEFILE_DOC)))
        for missing in sorted(phony - documented):
            problems.append(f"Makefile target `{missing}` is undocumented in reference-makefile.adoc")
        for extra in sorted(documented - phony):
            problems.append(f"reference-makefile.adoc documents `make {extra}` which is not a .PHONY target")

    # docs/Makefile <-> DOCS_HELP in scripts/mk_pretty.py. `help` renders the
    # panel itself, so it is not catalogued as one of its own rows.
    docs_phony = _phony_targets(DOCS_MAKEFILE) - {"help"}
    cataloged = _docs_help_targets()
    for missing in sorted(docs_phony - cataloged):
        problems.append(f"docs/Makefile target `{missing}` is missing from DOCS_HELP in scripts/mk_pretty.py")
    for extra in sorted(cataloged - docs_phony):
        problems.append(f"scripts/mk_pretty.py DOCS_HELP lists `{extra}` which is not a docs/Makefile .PHONY target")
    return problems


# --------------------------------------------------------------------------- #
# 8. Human inputs and review gates
# --------------------------------------------------------------------------- #

# Concrete repo path cited inside backticks on the human-inputs page.
_CITED_PATH_RE = re.compile(r"`((?:sql|reports)/[\w./-]+\.\w+)`")


def _tier_a_inputs() -> list[Path]:
    """The machine-enumerable input files an operator/SME edits pre-cutover."""
    crosswalks = SQL_DIR / "04_crosswalks"
    proposed = REPO_ROOT / "reports" / "crosswalks" / "proposed"
    confirmed = REPO_ROOT / "reports" / "crosswalks"
    filt = REPO_ROOT / "reports" / "filter"
    seeds = SQL_DIR / "02_seeds_static"
    jsonb = REPO_ROOT / "reports" / "jsonb_schemas"
    paths: list[Path] = []
    paths += [p for p in crosswalks.glob("*.sql") if not p.name.endswith("_check.sql")]
    paths += list(proposed.glob("*.proposed.csv"))
    paths += list(confirmed.glob("*.csv"))
    paths += [filt / "keep_ids.csv", filt / "drop_ids.csv"]
    paths += [REPO_ROOT / "reports" / "inputs" / "fk_overrides.yaml"]
    paths += list(jsonb.glob("*.schema.json"))
    paths += list(seeds.glob("*.sql"))
    paths += [
        REPO_ROOT / "reports" / "source_target_columns.csv",
        REPO_ROOT / "reports" / "pgm_dtl_tag_mapping.csv",
        REPO_ROOT / "reports" / "prisma_ddl.sha256",
        REPO_ROOT / "reports" / "prisma_schema.sha256",
    ]
    return paths


def check_human_inputs() -> list[str]:
    if not HUMAN_INPUTS_DOC.exists():
        return [f"missing {HUMAN_INPUTS_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    text = _read(HUMAN_INPUTS_DOC)

    # Forward: every Tier A input file is listed on the page.
    for p in _tier_a_inputs():
        rel = p.relative_to(REPO_ROOT).as_posix()
        if rel not in text:
            problems.append(f"Tier A input `{rel}` is not listed in reference-human-inputs.adoc")

    # Reverse: every concrete sql/|reports/ path the page cites must exist
    # (catches a renamed/deleted input or worksheet -- covers Tier B too).
    for rel in sorted(set(_CITED_PATH_RE.findall(text))):
        if not (REPO_ROOT / rel).exists():
            problems.append(f"reference-human-inputs.adoc cites `{rel}` which does not exist")
    return problems


# --------------------------------------------------------------------------- #
# 9. JSONB schema registry
# --------------------------------------------------------------------------- #


def _wired_schemas() -> set[str]:
    """Schema names guarded by a CREATE CONSTRAINT TRIGGER in sql/."""
    wired: set[str] = set()
    trigger_re = re.compile(
        r"CREATE CONSTRAINT TRIGGER.*?tg_validate_jsonb_against_registered_schema\s*\(\s*'([^']+)'",
        re.DOTALL | re.IGNORECASE,
    )
    for sql in SQL_DIR.rglob("*.sql"):
        wired.update(trigger_re.findall(_read(sql)))
    return wired


def check_jsonb_registry() -> list[str]:
    if not JSONB_DOC.exists():
        return [f"missing {JSONB_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    promoted = {p.name[: -len(".schema.json")] for p in JSONB_SCHEMAS_DIR.glob("*.schema.json")}
    wired = _wired_schemas()

    section = _section(_read(JSONB_DOC), "== Schemas in the registry today")
    doc_status: dict[str, bool] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("* `"):
            continue
        m = re.match(r"\* `([a-z_]+)`", stripped)
        if not m:
            continue
        is_wired = "wired" in stripped and "not wired" not in stripped
        doc_status[m.group(1)] = is_wired

    for missing in sorted(promoted - set(doc_status)):
        problems.append(f"promoted JSONB schema `{missing}` is not listed in reference-jsonb-schema-registry.adoc")
    for extra in sorted(set(doc_status) - promoted):
        problems.append(f"reference-jsonb-schema-registry.adoc lists `{extra}` with no promoted .schema.json file")
    for name in sorted(promoted & set(doc_status)):
        if doc_status[name] != (name in wired):
            want = "wired" if name in wired else "registered, not wired"
            problems.append(f"JSONB schema `{name}` documented wired={doc_status[name]} but code says it is {want}")
    return problems


# --------------------------------------------------------------------------- #
# 10. Rehearsal command inventory
# --------------------------------------------------------------------------- #


def _migrate_subcommands() -> set[str]:
    """`migrate <name>` subcommands from `@app.command("name")` decorators.

    Parsed via ``ast`` (no import) so the check works even before ``make
    sync`` has installed the package, and stays consistent with the rest of
    this module.
    """
    subs: set[str] = set()
    for node in ast.walk(_parse(CLI_PY)):
        if not isinstance(node, ast.FunctionDef):
            continue
        for dec in node.decorator_list:
            if not (
                isinstance(dec, ast.Call)
                and isinstance(dec.func, ast.Attribute)
                and dec.func.attr == "command"
                and dec.args
                and isinstance(dec.args[0], ast.Constant)
                and isinstance(dec.args[0].value, str)
            ):
                continue
            subs.add(dec.args[0].value)
    return subs


def check_rehearsal_commands() -> list[str]:
    """Forward-check the rehearsal command inventory against the code.

    Every `make <target>` and `migrate <phase>` the page mentions must exist
    (a real ``.PHONY`` target / a real ``@app.command``). The reverse
    direction is intentionally NOT required: the page covers only the
    rehearsal-relevant subset, not every target.
    """
    if not REHEARSAL_DOC.exists():
        return [f"missing {REHEARSAL_DOC.relative_to(REPO_ROOT)}"]
    problems: list[str] = []
    text = _read(REHEARSAL_DOC)
    phony = _phony_targets(ROOT_MAKEFILE)
    for target in sorted(set(_MAKE_TARGET_RE.findall(text))):
        if target not in phony:
            problems.append(
                f"reference-rehearsal-commands.adoc mentions `make {target}` "
                "which is not a .PHONY target in the root Makefile"
            )
    subs = _migrate_subcommands()
    if not subs:
        return [*problems, "could not parse @app.command names from migration/cli.py"]
    for name in sorted(set(_MIGRATE_CMD_RE.findall(text))):
        if name not in subs:
            problems.append(
                f"reference-rehearsal-commands.adoc mentions `migrate {name}` "
                "which is not a `migrate` subcommand in migration/cli.py"
            )
    return problems


# --------------------------------------------------------------------------- #
# Runner
# --------------------------------------------------------------------------- #

CHECKS = [
    ("regex", check_regex),
    ("gates", check_gates),
    ("templates", check_templates),
    ("stage-map", check_stage_map),
    ("env", check_env),
    ("package", check_package),
    ("makefile", check_makefile),
    ("rehearsal-commands", check_rehearsal_commands),
    ("human-inputs", check_human_inputs),
    ("jsonb-registry", check_jsonb_registry),
]


def main() -> int:
    failed = False
    for name, fn in CHECKS:
        problems = fn()
        if problems:
            failed = True
            print(f"verify-doc-facts [{name}]: FAIL ({len(problems)})", file=sys.stderr)
            for p in problems:
                print(f"  - {p}", file=sys.stderr)
        else:
            print(f"verify-doc-facts [{name}]: OK")
    if failed:
        print("verify-doc-facts: drift found; fix the page or the code.", file=sys.stderr)
        return 1
    print("verify-doc-facts: OK (all checks passed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
