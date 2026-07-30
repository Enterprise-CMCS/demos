# Documentation audit — 2026-07-30

Full-tree audit of the documentation set: the Asciidoctor wiki under `docs/`,
the repo-root markdown, `runbooks/**`, the hand-authored narrative under
`reports/**`, and the front-matter and header prose of `sql/**`. The task was
to fold every remaining markdown document into the wiki, purge what the fold
superseded, and reconcile the whole set against the code.

Every finding below was verified against the live tree — SQL, Python, YAML,
CSV, or a `git` fact — not against other prose. Where two documents agreed
with each other and both were wrong, the code broke the tie.

This audit supersedes `reports/audits/docs_audit.md`, which was deleted: its
undated filename made a stale snapshot read as current.

---

## 1. Scope and outcome

| | |
|---|---|
| Markdown files at start | 55 tracked |
| Markdown files deleted | 14 |
| New wiki pages authored | 9 |
| Wiki pages rewritten | 2 |
| New live-partials (markdown stays, wiki renders it) | 5 |
| New build-time guards | 3 |
| Existing tools repaired or extended | 8 |
| Net diff | 169 files, +11,750 / −6,399 |

The wiki went from 78 to 86 built pages. Four verification gates that were
failing at the start of this audit are green, and three new ones exist that
did not before.

---

## 2. What was wrong at the start

### 2.1 The verification suite was not actually verifying

`make verify` failed on four gates before a single content change. A failing
gate that nobody fixes is worse than no gate: it trains people to ignore the
output. All four were repaired first, so that every later finding had a
trustworthy signal behind it.

| Gate | Failure | Cause |
|---|---|---|
| `verify-cli-ref` | Generated page never matched | `cli_to_adoc.py` rendered at terminal width; output changed per machine |
| `verify-crosswalks` | Failed on an intentionally unregistered file | No way to express "skip this one" |
| `verify-doc-facts` | Regex pointed at a renamed symbol | `WAIVER_HELPER_SQL` had been renamed |
| `verify-counts` | 3 package rows, 6 Tier A input rows, 1 crosswalk row stale | Content drift |

`make cli-ref` and `make docnav` also fought each other: each rewrote the
other's footer, so a clean tree could not be reached. Fixed by having
`cli_to_adoc.py` emit the footer through `docnav.block_for()`.

### 2.2 Two markdown trees were never built at all

`docs/Makefile`'s `html` target builds `README.adoc toc.adoc spec/*.adoc
operator/*.adoc developer/*.adoc sme/*.adoc`. `docs/specs/` and
`docs/superpowers/` matched none of those globs. Eleven files, several
thousand lines of design specification, sat inside the documentation directory
and were never rendered, never linked, and never checked by any gate. Six of
them were the primary design record for shipped subsystems.

### 2.3 The cutover date was three different dates

| Date | Where | Status |
|---|---|---|
| `2026-07-01` | `docs/README.adoc` ×7, `canonical-spec.adoc` ×8 | Lapsed a month ago; presented as the live go-live on the landing page |
| `2026-08-20` | `sql/23_app_derived/50_application_phase.sql`, `parity.py`, and 4 prose sites | The in-code constant, superseded |
| `2026-08-13` | The decided date | Present nowhere at the start |

The in-code constant governs the Federal Comment past-window failsafe, so this
was not only a documentation defect: a wrong constant silently changes which
phases the loader forces to 'Completed'. All three are now `2026-08-13`
(Thursday), and `tests/sql/test_application_phase_load.py` pins the Eastern
midnight boundary either side of it.

---

## 3. Findings by class

### 3.1 Claims contradicted by the code

| Claim | Where | Truth |
|---|---|---|
| "Every transform is drop-and-rebuild, **never upsert**" | `explanation-idempotency.adoc:3`, `reference-pipeline-stages.adoc:82`, `README.md` | Three deliberate `ON CONFLICT DO UPDATE` sites: `sql/02_seeds_static/25_state_region.sql`, `sql/02_seeds_static/30_deliverable_action_chain.sql`, `migration/phases/init_pg.py`. Raised as `CODE_REVIEW.md` S1 against the README; it was live in two wiki pages too |
| Crosswalks load via "inlined `INSERT ... VALUES`" | `reference-pipeline-stages.adoc`, `explanation-idempotency.adoc`, `pipeline-stage-map.adoc` row 04 | `sql/04_crosswalks/` contains zero `INSERT` or `COPY`. It is DDL plus fail-closed `_check` queries; `init_pg.run_crosswalks()` COPYs values from `reports/crosswalks/*.csv` per `registry.yaml` |
| Stage 30 applies "FKs as `NOT VALID`, then `VALIDATE`" | `pipeline-stage-map.adoc` row 30 and its mermaid node | `sql/30_constraints/` is `.gitkeep`-only. `constraints.py` reads `state/prisma_fks.json`, captured at `migrate ddl`, and re-adds each FK itself |
| `make help` lists a `history` cutover phase | `scripts/mk_pretty.py:91` | No `history` in `lib.PHASES`, no CLI command, no Makefile target, no `migration/phases/history.py`. A hard-coded banner string only |
| CI runs `pytest`, `ruff`, and `ty` on push and PR | `canonical-spec.adoc` ×3, `howto-run-tests-locally.adoc` | `.github/workflows/ci.yml` does not exist and never did. No parent-repository workflow matches `data-migration/`. There is no CI for this subtree |
| `fil_doc_cd` mirrors the boolean type flags 1:1 | `sql/04_crosswalks/71_deliverable_file_type.sql` | Disproved by the repo's own live-PROD investigation: 1,872 rows have `bdgt_ntrlty_fil_ind = 1` with NULL `fil_doc_cd`, 76 of them live |
| `crosswalk_comment_origin` is gated and empty | `sql/99_parity/47_*.sql`, `parity.py`, `pending_approved_decisions.md` | Populated with 6 rows, registry-wired at `registry.yaml`. Routes are `private`/`public`, not `cms`/`state`. `S` (4,325 rows) is the only public code |
| The comment router covers "the 9 comment tables" | `canonical-spec.adoc:1154` | There are 10 `*_cmt` tables. Two load. `10_stg/70_comments.sql` and `20_app/70_comments.sql` were never authored; the work shipped as `10_stg/36_comment_resolved.sql` + `20_app/50_comment.sql` |
| The provenance check is "Parity check 25" | `explanation-dbt-alignment.adoc` | 46 checks: 23 numbered 1–24 (3 is a permanent gap, the retired BN JSONB check) and 23 registered without a number. There is no 25 |
| `deliverable_action` is net-new with no PMDA source | `reports/inputs/proposed_table_map.yaml:25` | BUILT. `sql/23_app_derived/60_deliverable_action.sql` synthesizes the minimal legal hop chain from each loaded deliverable's status |
| Filter reports land in `reports/filter/`, archived to `reports/filter/archive/` | `reports/filter/README.md`, `howto-curate-filter.adoc` | `emit_filter_report` writes `reports/runs/filter_<stamp>.md`. No `archive/` directory exists and nothing creates one |
| The DEMOS schema is `app.*` | 5 `sql/*/README.md` files, 8 sites | The four schemas are `mysql_raw`, `stg`, `demos_app`, `migration`. There is no `app` schema |
| Parity check 14 reports 19 tables as "16 BUILT, 1 PARTIAL, 1 DEFERRED" | `parity.py` | 16+1+1 = 18. The OUT-OF-SCOPE `document` row was never tallied. Fixed in the check, not just the docs |

### 3.2 Stale counts

Every count in the canonical spec's "current implementation state" section had
drifted. None were close.

| Subject | Claimed | Actual |
|---|---|---|
| `sql/04_crosswalks/` files | 29 | 35 |
| `sql/10_stg/` files | 29 | 33 |
| `sql/20_app/` files | 8 | 9 |
| `sql/21_app_associative/` files | 4 | 7 |
| `sql/23_app_derived/` files | 4 | 7 |
| `sql/99_parity/` files | 28 | 40 |
| `CheckResult`s collected | thirty-one | 46 |
| dbt-alignment entity count | stale | corrected during the fold |
| Scope ledger tables | 17 | 19 |

### 3.3 References that pointed at nothing

| Class | Count | Resolution |
|---|---|---|
| SQL `Refs:` front matter naming moved or deleted files | 32 | Repointed during the fold; two more found when the new checker was switched on |
| Narrative markdown citing moved specs | 14 | Repointed |
| `CODE_REVIEW.md` finding labels (`H4`, `H5`, `H7`) cited by 19 files | 18 citations | Labels never existed in this repo. `CODE_REVIEW.md` entered in the squashed import already describing a *prior* review as superseded, so they are unrecoverable. Citations dropped, invariant text kept |
| `migration-plan.adoc` evidence-column commit SHAs | 5 of 6 | Unresolvable after the squashed import (`5ee40a5c`). Removed rather than left looking authoritative; the column now cites files, which `verify_schema_refs.py` checks |
| CHANGELOG version-comparison links | 8 | Pointed at a private LAN Gitea instance by RFC 1918 address and port. Dead for everyone, and a needless private-address disclosure. Removed with a note; no `v0.x` tag was ever cut here anyway |
| Absolute `/Users/zoeelkins/Documents/specs/` paths | 2 | Replaced with a description of the layout history |
| `canonical-spec.adoc:810` `xref:` to a `.md` file | 1 | Caught by the new markdown guard the moment it was switched on |

### 3.4 Documents whose status had rotted

| Document | Recorded status | Actual |
|---|---|---|
| `migration-feasibility.md` (2026-07-09) | 4 checks PENDING, 1 GREEN, scope 17 tables, 2 cutover dates live | Checks 1/2/4/10/12 now GREEN, check 3 retired, check 21 regressed to PENDING, scope 19 tables, both cutover dates lapsed. Reconciled verdict by verdict into `explanation-migration-feasibility.adoc` |
| `document-migration.md` | Presented as a live build plan | OUT-OF-SCOPE by operator decision 2026-07-27. Its DDL pin was also stale (`30c6ee…` → `a4dd0db9…`) |
| Deliverable-action backfill spec | Single design | Three successive designs: FULL (2026-07-17) → MINIMAL (2026-07-21) → batch-aware (2026-07-29/30). The specified-vs-shipped history was nowhere |
| `migration-plan.adoc` Branch 10 (document / S3) | Pending | Superseded by the 2026-07-27 out-of-scope decision |
| `migration-plan.adoc` Branch 13 (`functions.sql` duties) | Pending | Two of three sub-items shipped; "not yet started" is false |
| `CODE_REVIEW.md` | Described as "a standing code-review findings log" | A dated snapshot: 2026-06-21, findings updated in place 2026-06-26 |
| `canonical-spec.adoc` §12 Timeline | The current schedule | An 8-week plan that ended 2026-06-26, with a Gantt frozen at 2026-07-09 whose amber bars understate delivery by three loaders |

### 3.5 Structural

- Two pages defined the same `[[deferred]]` anchor. Harmless today (each
  `.adoc` renders to its own HTML) but a latent collision; renamed to
  `[[document-deferred]]` and `[[audit-deferred-entities]]`.
- Five working documents under `reports/narrative/` and `runbooks/` were live,
  maintained, and invisible to the wiki. They now render as live-partials, so
  the markdown stays the editing surface and the wiki cannot fall behind it.
- `README.md` had grown to 410 lines and duplicated, badly, what the wiki
  already owned. Now 160 lines of orientation plus pointers, with the layout
  moved to a page where every backticked path is build-checked.

---

## 4. What was deleted

| File | Why |
|---|---|
| `docs/specs/` (5 files) | Folded into the developer book; the directory was never built |
| `docs/superpowers/` (2 plans) | Same |
| `docs/spec/jenkins-pipelines.md` | Folded to `explanation-jenkins-pipelines.adoc` |
| `docs/specs/deliverable-action-cms-priority-alignment-spec.md` | Superseded by the 2026-07-21 decision; citations reworded to name the decision |
| `APPS.md` | Auto-generated application registry nothing read. Closes W7 of the ownership remediation plan, whose one action was to correct a fact already stated correctly in the architecture overview |
| `reports/audits/docs_audit.md` | Superseded by this file; its undated name made it read as current |
| `pmda_highlights_reel.md` | **Folded, not discarded** — see below |

`reports/crosswalks/proposed/archive/signature_level_sme_decisions.md` was
kept: already archived, and the signature-level decision is still open.

### The one deletion that was reversed

`pmda_highlights_reel.md` (1,732 lines) was slated for deletion. It is the
only surviving description of the legacy PMDA application, reconstructed by
reading `cma-site` and `cma-service`, neither of which is in this tree. Two
live records depend on it: the workflow-level scope disposition table in
`pending_approved_decisions.md` is keyed to its eleven numbered workflows and
is published in the wiki, and a `notes.md` entry cites it for the
`mdcd_demo_num` reading behind the medicaid_id/chip_id decision.

Deleting it would have destroyed cited evidence. It moved instead to
`docs/developer/reference-legacy-pmda-workflows.adoc` with all eleven
workflows and all 41 extract queries intact, numbered anchors `#workflow-1`
through `#workflow-11` so the disposition table can deep-link, and an
admonition stating that it describes the source system, is dated, and has not
been re-verified against PMDA.

Three of its claims are contradicted by this repository. They were left in
place, because the page is evidence and correcting it would fabricate history:

1. It says `medicaid_id` and `chip_id` are trigger-generated and the PMDA demo
   number belongs in crosswalk data. The loader does the opposite:
   `medicaid_id` is always legacy-preserved.
2. It gives clean per-code meanings for `cmt_orgn_cd`. The crosswalk, authored
   from live PROD counts, found those meanings are not determinable from the
   source data.
3. Its signature-level map inserts `(0, NULL)` and omits code 4. DEMOS forbids
   NULL there and the loader coerces 0 to `'OA'`.

---

## 5. New guards

Each was proven to fail closed against a temporary probe before being trusted.

| Guard | What it prevents |
|---|---|
| `docs/tools/verify_docnav.py` | Both navigation surfaces — `toc.adoc` and the `docnav.py` `ORDER` list — silently diverging from the built page set. Previously only one was checked |
| `docs/tools/verify_docs_markdown.py` | The wiki drifting back to Markdown. Four rules: no tracked `.md` under `docs/`, no `xref:`/`link:` ending in `.md`, no ATX headings, no fences or `[label](target)` links. Caught a live defect on its first run |
| `scripts/check_sql_frontmatter.py` `Refs:` resolution | SQL header citations rotting invisibly. `Refs` is the one front-matter field whose entire value is paths; every token starting with a known top-level directory now has to resolve, against this repo and then the monorepo root. Found two stale citations on the first run |

Two existing checkers were also taught to see more: `verify_schema_refs.py`
now accepts sequences and GUCs as real `demos_app` objects instead of
reporting them as unknown, and `schema_model.py` parses `CREATE SEQUENCE`.

---

## 6. Left alone, deliberately

| Item | Reason |
|---|---|
| `reports/narrative/notes.md` entries that name deleted files or superseded constants | Append-only log. The file's own line 3 declares it. Two dated entries were **appended** recording the relocation rather than rewriting history |
| `reports/narrative/sme_signoff_2026-07-20.md` item 6, still describing `crosswalk_comment_origin` as gated | Dated ledger; the repo convention is that these record what was true on the date. The divergence is reconciled in `explanation-comments-routing.adoc` |
| `canonical-spec.adoc` §12 week schedule | Kept as the original plan of record — the exit gates were written against it and later sections cite weeks by number. Framed with an admonition and a current-status paragraph instead of being rewritten |
| `CODE_REVIEW.md`, `SECURITY_REVIEW.md` | Left at the repo root by decision. Only the dangling labels were removed |
| Three contradicted claims in the PMDA page | Evidence, not documentation. Reported in §4 instead |

---

## 7. Open, not resolved

1. **`proposed_table_map.yaml`'s partition has no correct bucket for
   `deliverable_action`.** The four buckets are `mapped`, `seeded`, `net_new`
   ("empty at cutover, populated by the new app; no source"), and `foldable`.
   `deliverable_action` is synthesized by the migration from source data
   without a column map, which is none of those. It stays in `net_new` so the
   partition remains total, with a comment saying why. `document` (OUT-OF-SCOPE)
   and `extension` (DEFERRED) are likewise still listed as `foldable` proposal
   targets. The partition contract needs a fifth bucket, or an explicit
   "already built" exclusion.

2. **`migration-plan.adoc` Branch 11 (derived status overlay) is unfalsifiable
   as written.** Its resolution is a decision *not* to build. Nothing in
   `sql/23_app_derived/` materializes the overlay, but absence cannot
   distinguish "not started" from "nothing to do". The status legend needs to
   say whether a deliberate non-build counts as Done.

3. **43 SQL files disagree with the installed pg_format 5.10.** Pre-existing
   and unrelated to this audit; verified byte-identical against a `git
   worktree` at HEAD before and after. The formatter's output de-indents
   `VALUES` rows and open parens to column 0, which is why the files were
   committed unformatted. Either pin the formatter version or accept its
   output wholesale, but not per-commit.

4. **`scripts/_pending_dups.sql` fails sqlfluff with 7 violations.**
   Pre-existing. It is a MySQL-dialect scratch script linted as Postgres.

5. **There is no CI.** Now documented as fact rather than implied away, but
   the underlying gap is real: nothing runs `pytest`, `ruff`, `ty`, or
   `sql-check` on push or PR. The `sql-check` pre-commit hook is the only
   automated gate, and it only fires locally.

---

## 8. Verification

Every phase of this audit was gated on the same bar, run green before each
commit:

```
cd docs && make verify      # 15 checks, exit 0
cd docs && make html        # asciidoctor --failure-level=WARN, exit 0
make lint                   # ruff
make typecheck              # ty
uv run pytest               # 615 passed, 372 skipped
uv run python scripts/check_sql_frontmatter.py
```

Final state: 86 built pages in both navigation surfaces, 95 pages passing
reference-integrity checks, 133 pages with no Markdown leakage, and 10 more
unit tests than at the start.
