# Security review: CWE-23, CWE-78, CWE-79, CWE-89

**Date:** 2026-07-10
**Scope:** targeted review of four CWE classes across `migration/`, `scripts/`,
`docs/tools/`, `pgloader/`, and `tests/`:

- [CWE-23](https://cwe.mitre.org/data/definitions/23.html) - Relative Path Traversal
- [CWE-78](https://cwe.mitre.org/data/definitions/78.html) - OS Command Injection
- [CWE-79](https://cwe.mitre.org/data/definitions/79.html) - Cross-site Scripting (XSS)
- [CWE-89](https://cwe.mitre.org/data/definitions/89.html) - SQL Injection

**Method:** full read of every SQL-interpolation, `subprocess`, filesystem, and
template-render call site; guards traced to their definitions; the actual public
exposure verified against the sister repo remote `Enterprise-CMCS/demos`.

## Threat model

This is a one-shot data-migration CLI run by a trusted DBA/operator against a
legacy MySQL source and a target Postgres. There is **no network request
handler and no browser-facing runtime**, so the classic precondition for these
CWEs (untrusted input crossing a trust boundary at runtime) largely does not
exist. Inputs are: operator `.env` config, AWS Secrets Manager, repo-controlled
YAML/CSV registries (behind PR review), and the legacy DB schema being migrated.

The code is mirrored to the **public** monorepo `Enterprise-CMCS/demos`. Public
status does not create any of these CWEs at runtime (the guards do not rely on
secrecy), but it shifts the real control for repo-sourced content from
input-sanitization to **branch protection + required PR review + CI**.

## Verdict, up front

All four CWE *patterns* are present in the tree; **none is an exploitable
vulnerability** in this threat model. Two policy/hygiene items were actioned;
one scanner finding is an accepted false positive.

| CWE | Present as pattern? | Exploitable? | Disposition |
|-----|--------------------|--------------|-------------|
| 89 SQLi | Yes (f-string SQL; `_apply_file`) | No | Guarded; one policy-consistency fix; one Snyk false positive |
| 78 Cmd inj | Yes (`shell=True`) | No | Load-bearing dev-only shell; documented + UI ignore |
| 23 Path traversal | CLI-arg -> `Path` in docs tools | No | Hardened with workspace confinement |
| 79 XSS | Yes (`autoescape=False`) | No | Accepted false positive (config render, not HTML) |

Snyk Code (SAST) findings are dispositioned individually below; paste-ready UI
ignore reasons are collected in the final section.

## CWE-89 - SQL Injection

Not exploitable. Every interpolation path is defended:

- **psycopg values/identifiers:** `psql_query`/`psql_command` take literal SQL +
  `params` for values; identifiers go through `psycopg.sql.Identifier`
  (`copy_csv_into_table`, `truncate_schema_data`, `psql_exec_composed` in
  `migration/lib.py`). `truncate_schema_data` additionally allowlists schema
  (`^[A-Za-z_][A-Za-z0-9_]*$`), LIKE patterns (`^[A-Za-z0-9_%]+$`), and exact
  table names.
- **DuckDB passthrough** (`mysql_query`/`postgres_query` take **no** bind
  params): table/column names are validated by a regex allowlist
  (`_safe_ident`/`_is_safe_identifier` = `^[A-Za-z_][A-Za-z0-9_]*$`) before
  interpolation; DSNs and static query strings are single-quote-doubled; code
  subsets are `int`-validated. See `scripts/crosswalk_audit.py`,
  `migration/phases/schema_snapshot.py`, `prod_schema_guard.py`,
  `reference_data.py`, `duck.py`.
- **Freeze instant:** the delta path validates against `_FREEZE_INSTANT_RE`
  before use (`migration/phases/load_delta.py`).

All interpolated identifiers originate from repo-controlled YAML/CSV or
`information_schema`, never from an attacker over a wire.

**Action taken (policy consistency):** `freeze.py` previously interpolated the
freeze instant via f-string (safe: machine `strftime`, regex-shaped; the lone
stated-policy exception, historically CODE_REVIEW M3). It is now parameterized:
`psql_command(env, "... VALUES (%s::timestamptz);", [instant])`. `psql_command`
gained an optional `params` argument to support this. This removes the last
value-interpolation exception, which matters for SAST/audit in a public repo.

**Snyk false positive - `docs/tools/table_flow_trace.py` `_apply_file`:** Snyk
reports "input from a database flows into execute." This is a misfire: `path` is
always a repo-controlled `.sql` file (schema DDL, the sha256-pinned Prisma DDL,
curated fixtures, crosswalk files globbed from repo dirs), applied verbatim to a
throwaway scratch DB. This is the by-design "execute repo SQL" pattern also used
by `lib.apply_dir`/`_execute_sql_file`; a DDL/fixture file cannot be
parameterized. No database or user input reaches the call. A `SECURITY:` comment
records this; disposition is a Snyk UI ignore (false positive).

## CWE-78 - OS Command Injection

Not exploitable.

- `migration/lib.py` `run`/`run_teed` use **list argv** with no `shell=True`;
  pgloader is invoked with a list. Safe.
- `scripts/mk_pretty.py` uses `subprocess.run(command, shell=True)`. This is
  **load-bearing dev-only tooling**: `command` is always a static Makefile
  recipe (the `$(STEP)` targets) that depends on shell features (`;`, `&&`,
  globs, redirects, env-var prefixes). Converting to `shell=False` would break
  `clean`, `clean-reports`, every `cd .. && ...` docs target, `test-db-up`,
  `spin_up`, and more. No untrusted/remote input reaches it; the only variable
  portion is `make <target> ARGS="..."`, supplied by the local developer.

**Action taken:** added an explanatory comment at the call site documenting why
`shell=True` is intentional and not an injection surface. (Ruff does not enable
flake8-bandit, so no lint suppression is needed.) Snyk Code flags this as command
injection (CLI arg -> `shell=True`); the taint is real but only reachable by
someone who already controls the local `make` invocation, so the disposition is a
Snyk UI ignore (accepted risk, not exploitable in context).

## CWE-23 - Relative Path Traversal

No meaningful runtime sink. Production file operations use fixed module-level
`Path` constants (`STATE_DIR`, `REPORTS_DIR`, `PRISMA_FKS_FILE`, ...).
Operator-supplied paths (`--out-dir`, drop-list, DSN) do not cross a trust
boundary - the operator already owns the machine. The healthz probe restricts
schemes to `http`/`https` (`migration/phases/flip.py`), so a `file://` URL cannot
turn the probe into a file read. There is no request-supplied filename joined to
a server root.

**Snyk findings + hardening applied.** Snyk Code flags CLI-argument-to-`Path`
flows in three docs tools:

- `docs/tools/data_dictionary_to_xlsx.py`: `out_path`, `--mmd-dir`,
  `--prisma-artifact`.
- `docs/tools/schema_diagrams_to_adoc.py`: `--hand-mmd` (into `check_drift`).

These are operator/CI documentation generators, not a runtime sink, so they are
not exploitable in this threat model. Because the defaults deliberately reach
**sibling checkouts** (`DEFAULT_MMD_DIR = REPO_ROOT.parent/mmd_sql_compare/...`,
`HAND_MMD_DEFAULT = REPO_ROOT.parent/demos/...`), a defense-in-depth
`_confined_path(...)` guard was added to both tools: each path is `resolve()`d
and rejected via `SystemExit` unless it is under the **workspace root**
(`REPO_ROOT.parent`). This blocks `../..` escapes, `/etc`, `/tmp`, etc., while
keeping every legitimate in-workspace default working. If Snyk Code does not
recognize the custom sanitizer, ignore with the "mitigated by confinement"
reason below.

## CWE-79 - Cross-site Scripting

Not exploitable. There is no web application serving pages to browsers at
runtime.

- `jinja2.Environment(autoescape=False)` in `migration/lib.py` renders pgloader
  `.load` **config files** consumed by the pgloader binary, never HTML. Its sole
  consumer is `render_template` (used by `load_full.py`/`load_delta.py`).
  Enabling autoescape would HTML-entity-encode `& < > ' "` inside DSNs/SQL and
  corrupt the rendered config.
- The docs pipeline generates `.adoc` → asciidoctor static HTML, built and
  viewed by operators; the CI `docs.yml` uploads it as a **download-only Actions
  artifact** (no GitHub Pages deploy). GitHub also sanitizes rendered
  `.adoc`/`.md` (strips `<script>`). No built HTML is committed. `_esc` in the
  docs tools escapes AsciiDoc table pipes, not HTML entities.

**Disposition:** the Snyk Code finding "jinja2.Environment autoescape=False ->
XSS" (`migration/lib.py`) is an **accepted false positive**, ignored in the Snyk
UI with the justification recorded below. (`.snyk` policy ignores are not
supported for Snyk Code; the UI ignore is the supported, precise path.) A
`SECURITY:` comment at the call site records the same rationale.

> **Snyk UI ignore reason (paste-ready):** False positive. This
> `jinja2.Environment` renders pgloader `.load` command files consumed by the
> pgloader binary, not HTML served to a browser, so there is no XSS sink.
> `autoescape=False` is required: enabling it would HTML-entity-encode
> `& < > ' "` inside connection strings and SQL cast blocks and corrupt the
> rendered config. Inputs are operator-controlled config plus a regex-validated
> freeze instant. See SECURITY_REVIEW.md (CWE-79).

## Public-repo exposure check

Verified against remote `Enterprise-CMCS/demos`:

- `.env` and `.env.*` are **not** tracked (only `.env.example`).
- No bulk DB dumps tracked (`reports/schema_snapshot/`, `reports/reference_data/`,
  `reports/runs/` pgloader logs, `state/` are all gitignored).
- No built HTML committed; no hardcoded credentials / AWS keys in tracked files.
- Committed data is reference-vocabulary crosswalks (status/type/state codes),
  generated `.adoc`, and config inputs - low sensitivity.

Minor note: `Makefile` hardcodes a `POSTGRES_PASSWORD` for the ephemeral local
`demos-test-pg` Docker container - a throwaway local test credential, not a real
secret, but it is a committed literal in a public repo.

## Snyk Code UI ignore reasons (paste-ready)

`.snyk` policy ignores do not apply to Snyk Code; ignore each in the Snyk UI.

- **`migration/lib.py` - autoescape=False (XSS):** see the paste-ready reason in
  the CWE-79 section above.
- **`scripts/mk_pretty.py` - command injection (`shell=True`):**
  > Accepted risk, not exploitable in context. `mk_pretty.py` is a dev-only
  > Makefile output wrapper; `command` is always a static Makefile recipe (the
  > `$(STEP)` targets) that requires shell features (`;`, `&&`, globs,
  > redirects). `shell=True` is load-bearing; `shell=False` would break `clean`,
  > the docs targets, `test-db-up`, etc. The only variable input is
  > `make <target> ARGS="..."`, supplied by the local developer - no remote or
  > untrusted input. See SECURITY_REVIEW.md (CWE-78).
- **`docs/tools/table_flow_trace.py` - SQL injection (`_apply_file`):**
  > False positive. `path` is always a repo-controlled `.sql` file (schema DDL,
  > the sha256-pinned Prisma DDL, curated fixtures, crosswalk files) applied
  > verbatim to a throwaway scratch DB - the by-design "execute repo SQL"
  > pattern (cf. `lib.apply_dir`). No database or user input reaches the call.
  > See SECURITY_REVIEW.md (CWE-89).
- **`docs/tools/data_dictionary_to_xlsx.py` / `schema_diagrams_to_adoc.py` -
  path traversal:** ignore only if Snyk does not recognize the added guard.
  > Mitigated. Operator/CI docs tool; each CLI/env path now flows through
  > `_confined_path()`, which `resolve()`s the path and rejects (SystemExit)
  > anything outside the workspace root. Not a runtime sink. See
  > SECURITY_REVIEW.md (CWE-23).

## Residual items

1. **Governance, not code:** in the public repo, a malicious PR could add a raw
   `.sql` file (`apply_dir` executes repo SQL verbatim, by design) or edit a
   Makefile recipe run under `shell=True`. The control is branch protection +
   required review + CI, not runtime input validation.
2. **Future XSS watch:** if the built HTML docs are ever deployed to a hosted,
   browser-facing site (e.g. GitHub Pages), re-evaluate CWE-79 - `_esc` would
   need HTML-entity escaping of any DB-sourced free-text.

