# First Clean End-to-End Rehearsal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Required per-repo skill before any SQL/phase change: `migration-tdd`.

**Goal:** Get the pipeline to complete one full dress rehearsal (`init` → `parity --accept-pending`) against a real MySQL snapshot, ending with a parity report that is **PENDING with zero RED** and every gate through `parity` marked.

**Architecture:** Layered numbered-SQL pipeline orchestrated by a `uv`-managed Typer CLI. Each phase is file-gated (`state/<phase>.ok`). The target `demos_app` schema is Prisma-owned; this repo only adds `mysql_raw`/`stg`/`migration` transforms, crosswalks, and parity. A rehearsal exercises: source load (pgloader) → crosswalks → staging filters → app loaders → FK re-validation → parity. (The P4 history backfill was removed in 0.7.0: history is DEMOS-owned and not migrated.)

**Tech Stack:** Python 3.11, Typer, psycopg 3, PostgreSQL 16 (`pg_jsonschema`), pgloader, DuckDB, `uv`. Tests: pytest pure tier (no DB) + `tests/sql/` apply-twice harness gated on `PG_TEST_DSN`.

## Status (updated 2026-06-26)

| WS | Title | Status |
|---|---|---|
| W2 | signature_level crosswalk | **DONE** (`44abd2f`) |
| W3 | deliverable_status crosswalk | **DONE** (`44abd2f`) |
| W1 | role crosswalk | **RESOLVED by split** — `44/45_system_role` + `46/47_demonstration_role` + `42/43_role_person_type`; the unified scaffold + proposals were removed (`44587b9`) |
| W4 | demo-status code 1 ("Pending") | **RESOLVED** (`941e9eb`, decision D1) — SME mapped code 1 -> 'Under Review' in `demo_status.csv`; `11_demo_status_check` no longer fails closed on it. Secondary SME confirmation of 'Under Review' vs 'Pre-Submission' still wanted (non-blocking) |
| W5 | state coverage (parity 8) | **OPEN** — non-gating drift check landed (`b934c29`); the gating fix (add territory vs filter) still needed |
| W6 | active-user coverage (parity 11) | **OPEN** |
| W7 | seeded-table capture sanity | **MITIGATED** — the CODE_REVIEW H1 fix (`build.py:308 _drop_demos_app_fks` before the CASCADE truncate) removes the cascade-into-seeds hazard; a DB regression test is still on the backlog |
| W8 | 50_sequences generator | **RESOLVED / moot** — demonstration ids are UUIDs (no sequence); the two id-minting sequences (`chip_id_number_seq`, `medicaid_id_number_seq`) are already `setval`-reconciled inline in `20_app/30_demonstration.sql`; the `revision_id` SERIALs are moot since history ships empty (0.7.0). See `sql/50_sequences/README.md`. No `sequences.py` phase needed |
| W0/W9 | env standup + rehearsal run | **OPEN** — the rehearsal itself |

CODE_REVIEW **H1** and **H2** are no longer rehearsal blockers (both code-fixed 2026-06-26): H2 is fully resolved (`parity.py:1182` `die()`s on non-GREEN, with exit-code tests in `test_parity.py`); H1's code fix landed (`build.py:308`), leaving only its regression test on the backlog.

Beyond-plan loaders since built (not rehearsal blockers): `amendment` + `application_date` (`585f9ee`), medicaid.gov 1115 outcome-fact parity (`2dfd18f`), and the demonstration/system role assignments that the W1 split feeds.

## Global Constraints

- All SQL must be **idempotent** and **apply cleanly twice** (drop-recreate or truncate-insert). Apply-twice test is mandatory for any SQL change.
- All crosswalk values are now **CSV-authored and COPY'd** via `reports/crosswalks/registry.yaml` (refactor `refactor(crosswalks): author all crosswalk values via CSV`); every `04_crosswalks/*.sql` file is DDL only. The registry `columns:` list is passed to `copy_csv_into_table` as `header_expect`, so a renamed/reordered CSV column fails closed. The four formerly-inline crosswalks (`signature_level`, `role_person_type`, `deliverable_status`, `amendment_status`) now load from `reports/crosswalks/<name>.csv` like the rest.
- `demos_app` is **Prisma-owned**: never author `demos_app` tables, indexes, triggers, or seeds here.
- Parity **RED never marks the gate**, even with `--accept-pending`; only all-PENDING (no RED) marks under `--accept-pending`. Any single RED blocks the rehearsal.
- Crosswalk completeness checks **fail closed** (`RAISE EXCEPTION`) on an unmapped source code; sentinel/none-confidence codes are intentionally left with a NULL target so the source's actual use of them surfaces as an exception, not a silent drop.
- `ruff`, `ty`, and `pytest` must pass; CI pure-tier coverage floor is 69%.
- Run the SQL tier locally with `make test-db-up` (Docker, has `pg_jsonschema`) or the `live-pg-tester` skill (local PG, no `pg_jsonschema`). Crosswalk tests do not need `pg_jsonschema`.

---

## File Structure

| Workstream | Files created / modified |
|---|---|
| W2 signature_level | **DONE** (`44abd2f`); values later moved to `reports/crosswalks/signature_level.csv` (CSV-authored, DDL in `30_signature_level.sql`); tests in `tests/sql/test_crosswalk_checks.py` |
| W3 deliverable_status | **DONE** (`44abd2f`); values later moved to `reports/crosswalks/deliverable_status.csv` (CSV-authored, DDL in `50_deliverable_status.sql`); tests in `tests/sql/test_crosswalk_checks.py` |
| W1 role | **RESOLVED by split** — superseded by `44_system_role.sql` (`system_role.csv`) + `46_demonstration_role.sql` (`demonstration_role.csv`), each with its own `*_check.sql`. The unified `40_role.sql` / `41_role_check.sql` + the `role.proposed.csv` / `contact_type.proposed.csv` proposals were removed. |
| W4 demo-status code 1 | Modify `reports/crosswalks/demo_status.csv`; decision in `reports/narrative/pending_approved_decisions.md` |
| W5 state coverage (parity 8) | Modify `sql/02_seeds_static/25_state_region.sql` and/or `sql/10_stg/10_filter_demo.sql`; Test `tests/sql/` |
| W6 active-user coverage (parity 11) | Add `reports/filter/keep_ids.csv` entries and/or refine `sql/10_stg/17_filter_user.sql`; Test `tests/sql/` |
| W8 sequences | Create `migration/phases/sequences.py` (or extend `constraints.py`) + generated `sql/50_sequences/` output; Test `tests/test_sequences.py` |
| W0/W7/W9 ops | `.env`, `state/`, rehearsal log under `reports/` |

---

## Task 1: W2 — signature_level crosswalk (inline INSERT) — DONE (`44abd2f`)

> Completed: the inline INSERT below was applied to `30_signature_level.sql` and
> the four tests pass. Steps retained for the record.

**Files:**
- Modify: `sql/04_crosswalks/30_signature_level.sql` (replace the commented TODO with a real INSERT)
- Test: `tests/sql/test_crosswalk_checks.py`

**Interfaces:**
- Produces: `mysql_raw.crosswalk_signature_level(legacy_int_cd, legacy_name, demos_text_id, notes)` populated for legacy codes 0–4.
- Consumed by: `sql/04_crosswalks/31_signature_level_check.sql` and the demonstration loader's signature resolution.

**Data source of truth:** `reports/crosswalks/proposed/archive/signature_level.proposed.csv` (`sme_confirmed_value` column). Source domain from `reports/reference_data/mdcd_demo_aplctn_sgntr_lvl_rfrnc.csv` = codes 0–4. Target seed = `{OA, OCD, OGD}` (verified in the pinned Prisma DDL).

- [ ] **Step 1: Write the failing tests** in `tests/sql/test_crosswalk_checks.py`

```python
SIGNATURE_LEVEL_SQL = CHECK_DIR / "30_signature_level.sql"
SIGNATURE_LEVEL_CHECK = CHECK_DIR / "31_signature_level_check.sql"


def _provision_signature_level(conn: Any) -> None:
    """Real crosswalk SQL + minimal source/seed to exercise (a),(b),(c)."""
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.signature_level (id text PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.signature_level VALUES ('OA'),('OCD'),('OGD')")
    conn.execute(
        "CREATE TABLE mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd int, mdcd_demo_aplctn_sgntr_lvl_cd int)"
    )
    conn.execute(SIGNATURE_LEVEL_SQL.read_text(encoding="utf-8"))


def test_signature_level_idempotent(pg_db: psycopg.Connection) -> None:
    _provision_signature_level(pg_db)
    pg_db.execute(SIGNATURE_LEVEL_SQL.read_text(encoding="utf-8"))  # second apply
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_signature_level")
        assert cur.fetchone() == (5,)


def test_signature_level_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd) VALUES (2,1),(3,2),(8,3)"
    )
    _run(pg_db, SIGNATURE_LEVEL_CHECK)  # (a)+(b)+(c) all green -> no raise


def test_signature_level_unmapped_code_raises(pg_db: psycopg.Connection) -> None:
    import psycopg
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd) VALUES (2, 99)"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)


def test_signature_level_approved_null_raises(pg_db: psycopg.Connection) -> None:
    """Clause (c): an APPROVED demo (status 2) on code 0 -> NULL signature fails closed."""
    import psycopg
    _provision_signature_level(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_demo "
        "(mdcd_demo_stus_cd, mdcd_demo_aplctn_sgntr_lvl_cd) VALUES (2, 0)"
    )
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, SIGNATURE_LEVEL_CHECK)
```

- [ ] **Step 2: Run tests; verify they fail for the right reason**

Run: `PG_TEST_DSN=... uv run pytest tests/sql/test_crosswalk_checks.py -k signature_level -v`
Expected: FAIL — `crosswalk_signature_level` is empty, so `idempotent` sees count 0 (not 5) and `mapped_codes_pass` raises on completeness.

- [ ] **Step 3: Implement** — replace the TODO comment block at the end of `sql/04_crosswalks/30_signature_level.sql` with:

```sql
INSERT INTO mysql_raw.crosswalk_signature_level
  (legacy_int_cd, legacy_name, demos_text_id, notes) VALUES
  (0, '-- Please Select --', NULL,
     'sentinel; a DEMOS trigger rejects NULL signature on APPROVED demonstrations, so an approved row on code 0 is a pre-load data-quality exception, not a NULL mapping'),
  (1, 'OA',  'OA',  NULL),
  (2, 'OCD', 'OCD', NULL),
  (3, 'OGD', 'OGD',
     'PRESERVE OGD (in signature_level seed). Loading OGD-level rows is blocked only by the demonstration/amendment/extension signature CHECK constraints; widening those is a DEMOS target-schema task (see _review.md), not a crosswalk change'),
  (4, 'DD',  NULL,
     'deleted in source (dltd_ind=1); no DD in signature_level seed. SME decision pending: treat as OGD, add a DD signature_level, or confirm no live DD rows exist');
```

- [ ] **Step 4: Run tests; verify pass**

Run: `PG_TEST_DSN=... uv run pytest tests/sql/test_crosswalk_checks.py -k signature_level -v`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add sql/04_crosswalks/30_signature_level.sql tests/sql/test_crosswalk_checks.py
git commit -m "feat(crosswalks): inline signature_level mapping (W2)"
```

---

## Task 2: W3 — deliverable_status crosswalk (inline INSERT) — DONE (`44abd2f`)

> Completed: the inline tuple INSERT below was applied to
> `50_deliverable_status.sql` and the tests pass. Steps retained for the record.

**Files:**
- Modify: `sql/04_crosswalks/50_deliverable_status.sql`
- Test: `tests/sql/test_crosswalk_checks.py`

**Interfaces:**
- Produces: `mysql_raw.crosswalk_deliverable_status(legacy_int_cd, legacy_name, status_id, due_date_type_id, expected_to_be_submitted, emit_extension_status, notes)` for codes 0–16.
- Consumed by: `sql/04_crosswalks/51_deliverable_status_check.sql` and the (future) deliverable loader.

**Data source of truth:** `reports/crosswalks/proposed/archive/deliverable_status.proposed.csv`. Target seeds verified in pinned DDL: `deliverable_status = {Upcoming, Past Due, Submitted, Under CMS Review, Accepted, Approved, Received and Filed, Deleted}`; `deliverable_due_date_type = {Normal, Open Ended}`; `deliverable_extension_status = {Requested, Approved, Denied, Withdrawn}`. Codes 7 (Overridden) and 9 (In Audit) are confidence=none → NULL `status_id` (fail-closed).

- [ ] **Step 1: Write the failing tests** in `tests/sql/test_crosswalk_checks.py`

```python
DELIVERABLE_STATUS_SQL = CHECK_DIR / "50_deliverable_status.sql"
DELIVERABLE_STATUS_CHECK = CHECK_DIR / "51_deliverable_status_check.sql"


def _provision_deliverable_status(conn: Any) -> None:
    conn.execute("DROP SCHEMA IF EXISTS mysql_raw CASCADE")
    conn.execute("DROP SCHEMA IF EXISTS demos_app CASCADE")
    conn.execute("CREATE SCHEMA mysql_raw")
    conn.execute("CREATE SCHEMA demos_app")
    conn.execute("CREATE TABLE demos_app.deliverable_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_status VALUES "
        "('Upcoming'),('Past Due'),('Submitted'),('Under CMS Review'),"
        "('Accepted'),('Approved'),('Received and Filed'),('Deleted')"
    )
    conn.execute("CREATE TABLE demos_app.deliverable_due_date_type (id text PRIMARY KEY)")
    conn.execute("INSERT INTO demos_app.deliverable_due_date_type VALUES ('Normal'),('Open Ended')")
    conn.execute("CREATE TABLE demos_app.deliverable_extension_status (id text PRIMARY KEY)")
    conn.execute(
        "INSERT INTO demos_app.deliverable_extension_status VALUES "
        "('Requested'),('Approved'),('Denied'),('Withdrawn')"
    )
    conn.execute("CREATE TABLE mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd int)")
    conn.execute(DELIVERABLE_STATUS_SQL.read_text(encoding="utf-8"))


def test_deliverable_status_idempotent(pg_db: psycopg.Connection) -> None:
    _provision_deliverable_status(pg_db)
    pg_db.execute(DELIVERABLE_STATUS_SQL.read_text(encoding="utf-8"))
    with pg_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM mysql_raw.crosswalk_deliverable_status")
        assert cur.fetchone() == (17,)  # codes 0..16


def test_deliverable_status_mapped_codes_pass(pg_db: psycopg.Connection) -> None:
    _provision_deliverable_status(pg_db)
    pg_db.execute(
        "INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES "
        "(1),(3),(5),(6),(8),(13),(14),(15),(16)"
    )
    _run(pg_db, DELIVERABLE_STATUS_CHECK)  # exercises (a)+(b); no raise


def test_deliverable_status_none_confidence_code_raises(pg_db: psycopg.Connection) -> None:
    """Codes 7/9 are intentionally NULL status_id (fail-closed); source use must abort."""
    import psycopg
    _provision_deliverable_status(pg_db)
    pg_db.execute("INSERT INTO mysql_raw.mdcd_dlvrbl (mdcd_dlvrbl_crnt_stus_cd) VALUES (7)")
    with pytest.raises(psycopg.errors.RaiseException):
        _run(pg_db, DELIVERABLE_STATUS_CHECK)
```

- [ ] **Step 2: Run tests; verify they fail for the right reason**

Run: `PG_TEST_DSN=... uv run pytest tests/sql/test_crosswalk_checks.py -k deliverable_status -v`
Expected: FAIL — table empty → idempotent count 0 (not 17), mapped_codes_pass raises on completeness.

- [ ] **Step 3: Implement** — replace the TODO block at the end of `sql/04_crosswalks/50_deliverable_status.sql` with:

```sql
INSERT INTO mysql_raw.crosswalk_deliverable_status
  (legacy_int_cd, legacy_name, status_id, due_date_type_id,
   expected_to_be_submitted, emit_extension_status, notes) VALUES
  (0,  'N/A',                               NULL,                 'Normal',     NULL,  NULL,        'sentinel; no deliverable state'),
  (1,  'Upcoming',                          'Upcoming',           'Normal',     true,  NULL,        NULL),
  (2,  'Work in Progress',                  'Upcoming',           'Normal',     true,  NULL,        'no Work in Progress in seed; in-progress slot = Upcoming'),
  (3,  'Submitted',                         'Submitted',          'Normal',     true,  NULL,        NULL),
  (4,  'Requested Resubmission',            'Upcoming',           'Normal',     true,  NULL,        'action -> Upcoming'),
  (5,  'Past Due',                          'Past Due',           'Normal',     true,  NULL,        NULL),
  (6,  'Accepted',                          'Accepted',           'Normal',     false, NULL,        'terminal; no longer expected'),
  (7,  'Overridden',                        NULL,                 'Normal',     false, NULL,        'none-confidence: no Overridden status in seed; needs SME + status-history lookup'),
  (8,  'Under Review',                      'Under CMS Review',   'Normal',     true,  NULL,        'Under Review -> Under CMS Review (seed name)'),
  (9,  'In Audit',                          NULL,                 'Normal',     NULL,  NULL,        'none-confidence: no In Audit status in DEMOS; SME decision (likely Under CMS Review)'),
  (10, 'Overridden / Accepted',             'Accepted',           'Normal',     false, NULL,        'terminal outcome = Accepted'),
  (11, 'Overridden / Request Resubmission', 'Upcoming',           'Normal',     false, NULL,        'action = Requested Resubmission -> Upcoming'),
  (12, 'Received',                          'Received and Filed', 'Normal',     false, NULL,        'Received -> Received and Filed (seed name); terminal'),
  (13, 'Approved',                          'Approved',           'Normal',     false, NULL,        'terminal'),
  (14, 'Under CMS Review',                  'Under CMS Review',   'Normal',     true,  NULL,        'direct match'),
  (15, 'Open-ended',                        'Upcoming',           'Open Ended', true,  NULL,        'NOT a status: due_date_type_id=Open Ended; lifecycle inferred'),
  (16, 'Pending Due Date Change',           'Upcoming',           'Normal',     true,  'Requested', 'NOT a status: model as deliverable_extension (Requested)');
```

- [ ] **Step 4: Run tests; verify pass**

Run: `PG_TEST_DSN=... uv run pytest tests/sql/test_crosswalk_checks.py -k deliverable_status -v`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add sql/04_crosswalks/50_deliverable_status.sql tests/sql/test_crosswalk_checks.py
git commit -m "feat(crosswalks): inline deliverable_status tuple mapping (W3)"
```

---

## Task 3: W1 — role crosswalk — RESOLVED (split, not a blocker)

**Status:** DONE via a structural split, superseding the original "author one
unified `crosswalk_role`" plan. The single overlapping-code-space table was the
wrong shape: the two legacy sources map to two different DEMOS grant levels and
assignment homes, so each got its own self-contained, CSV-canonical crosswalk:

- **System grant level:** `sql/04_crosswalks/44_system_role.sql` +
  `45_system_role_check.sql`, loaded from `reports/crosswalks/system_role.csv`
  (registry-wired). Feeds `system_role_assignment`.
- **Demonstration grant level:** `sql/04_crosswalks/46_demonstration_role.sql` +
  `47_demonstration_role_check.sql`, loaded from
  `reports/crosswalks/demonstration_role.csv` (registry-wired, column-keyed).
  Feeds `demonstration_role_assignment` + `primary_demonstration_role_assignment`.
- **person_type identity class:** already inlined + self-contained in
  `42_role_person_type.sql` / `43_role_person_type_check.sql`.

The unified `40_role.sql` / `41_role_check.sql` and the
`role.proposed.csv` / `contact_type.proposed.csv` proposal sheets were
**removed** — they were superseded dead code and, because `run_crosswalks`
globs every `*.sql`, `41_role_check.sql` would have fail-closed on the
permanently-empty `crosswalk_role` the moment `role_rfrnc` loaded.

**Remaining SME work (does not block the rehearsal):** formal ratification of
the values now living in `system_role.csv` / `demonstration_role.csv`
(external-evaluator code 3 yields a `person` but no assignment; the
M&E-vs-Policy TD column semantics). The `*_check.sql` files already fail closed
on any source code that is not covered, so a drift cannot pass silently.

---

## Task 4: W4 — demo-status code 1 ("Pending") decision

**Files:** `reports/crosswalks/demo_status.csv`; `reports/narrative/pending_approved_decisions.md`

**Decision owner:** SME. Code 1 is deliberately withheld from `demo_status.csv` today; `11_demo_status_check` (and `build_stg`) fail the instant any source demo carries status code 1.

- [ ] **Step 1:** SME decides the code-1 mapping (Pre-Submission vs Under Review vs withhold-by-filter).
- [ ] **Step 2:** If mapped, add the row to `reports/crosswalks/demo_status.csv`; if withheld, add a filter rule + record rationale in `pending_approved_decisions.md`.
- [ ] **Step 3:** Extend `test_crosswalk_checks.py` so a code-1 source row passes (or is provably filtered).
- [ ] **Step 4:** Commit.

**Acceptance:** a source `mdcd_demo` row with `mdcd_demo_stus_cd = 1` no longer aborts `crosswalks` or `build_stg`.

---

## Task 5: W5 — state coverage for parity check 8 (RED risk)

**Files:** `sql/02_seeds_static/25_state_region.sql` and/or `sql/10_stg/10_filter_demo.sql`; `tests/sql/`

**Why:** `migration.state_region` has only 56 entries (no territories FM/MH/PW/UM, no `XX`). A kept demonstration with a NULL or territory/`XX`/junk 2-letter state code enters `stg.demonstration_resolved` but is dropped by the loader's `JOIN state_region` → present in source, absent in `demos_app` → **parity check 8 RED** (blocks even `--accept-pending`).

- [ ] **Step 1:** From the snapshot, enumerate distinct `geo_ansi_state_cd` on kept demos and find which are absent from `state_region` (write a failing apply-twice/parity test asserting check 8 returns 0 rows).
- [ ] **Step 2:** Decide per code: add the territory to `state_region` (with its CMS region) **or** exclude those demos in `10_filter_demo.sql` with a recorded rationale. Do not silently keep-and-drop.
- [ ] **Step 3:** Implement the chosen fix; re-run; assert check 8 GREEN.
- [ ] **Step 4:** Commit.

**Acceptance:** `migration._parity_demonstration_completeness` returns 0 rows on the snapshot.

---

## Task 6: W6 — active-user coverage for parity check 11 (RED risk)

**Files:** `reports/filter/keep_ids.csv`; possibly `sql/10_stg/17_filter_user.sql`; `tests/sql/`

**Why:** The user filter drops NULL/odd-email service accounts and test-pattern usernames. Any still-active account (recent `lastaccess`, `deleted=0`) it drops, with no `keep_ids` override → **parity check 11 RED**.

- [ ] **Step 1:** From the snapshot, list rows in `migration._parity_active_users_coverage` (active but filtered). Write a failing test asserting check 11 returns 0 rows.
- [ ] **Step 2:** For each, either add a `reports/filter/keep_ids.csv` override (force-keep) or confirm the exclusion is correct and refine the coverage view / filter accordingly.
- [ ] **Step 3:** Re-run; assert check 11 GREEN.
- [ ] **Step 4:** Commit.

**Acceptance:** `migration._parity_active_users_coverage` returns 0 rows on the snapshot.

---

## Task 7: W7 — seeded-table capture sanity (constraints)

**Files:** none (verification); guards `build_app`/`constraints`.

- [ ] **Step 1:** Confirm `state/prisma_seeded_tables.json` exists from a real `migrate ddl` run (it falls back to coarse `%_status`/`%_type` patterns if missing, which would let `build_app` truncate seeded lookups and fail `constraints` VALIDATE).
- [ ] **Step 2:** Add/keep a DB-backed regression test: seed a lookup, apply demos_app FKs, re-run `run_build_app`, assert the seeded rows survive (closes CODE_REVIEW H1 latency).

**Acceptance:** a second `run_constraints` ends with zero invalid FKs (`state/fk_violations.csv` empty).

---

## Task 8: W8 — 50_sequences generator (target introspection)

**Files:** Create `migration/phases/sequences.py` (or extend `constraints.py`); Test `tests/test_sequences.py`

**Why:** The 37 `revision_id` SERIAL sequences and the two `21-W` minting sequences (`medicaid_id_number_seq`, `chip_id_number_seq`) must be `setval`'d above the loaded max, or the DEMOS `log_changes_*` triggers / id minting collide post-flip. (History tables ship empty now, but the DEMOS capture triggers begin writing them post-cutover, so the `revision_id` sequences still must clear any loaded max.) Input is **target introspection** (`pg_get_serial_sequence`/`pg_sequences`), not the source snapshot.

- [ ] **Step 1:** Write a unit test: given a fake target catalog with a serial column at max=N, the generated statement is `SELECT setval(pg_get_serial_sequence('demos_app."x"','col'), N)`.
- [ ] **Step 2:** Implement a function that enumerates `demos_app` sequence-backed columns and emits per-table `setval` to `max(col)`.
- [ ] **Step 3:** Add a DB-backed apply-twice test (idempotent setval).
- [ ] **Step 4:** Wire into the `constraints` phase tail (it already calls `apply_dir(50_sequences)`), or as its own gated phase. Commit.

**Acceptance:** post-`constraints`, every sequence reports `last_value >= max(backing column)`. Needed before a cutover-grade (Tier-2) rehearsal; optional for Tier-1.

---

## Task 0 / 9: W0 environment standup + rehearsal dry-run (ops)

**Files:** `.env`, `state/`, rehearsal log under `reports/`.

- [ ] **W0:** Provision a recent MySQL snapshot (or load one into `docker-compose.test.yml`'s MySQL); a target PG (local `PG_URL` or staging RDS clone with the Prisma artifact applied); set a placeholder `MYSQL_URL` even for offline phases; `make fetch_prisma --verify-only` to confirm the cached artifact. Leave `REFERENCE_PG_URL` blank for local (guard self-skips with WARN).
- [ ] **Probe run (de-risk early):** `rm -f state/*.ok`; `migrate init ddl load-full crosswalks build` and collect the *actual* failing codes (feeds W4/W5/W6) before investing blindly.
- [ ] **W9 full rehearsal:** run the chain `init → ddl → load-full → seeds → crosswalks → id-maps → preflight → freeze → delta → build → constraints → parity --accept-pending`, **timing every phase**; expect parity PENDING (checks 1/2/4 and possibly 10-flags), zero RED, gate marked. Record timings + surprises in `reports/narrative/notes.md` and a rehearsal log. (No `history` phase — removed in 0.7.0.)

**Acceptance:** parity report `**OVERALL STATUS: PENDING**` with no RED check; `state/parity.ok` present; wall-clock per phase recorded.

---

## Out of scope for the first rehearsal (defer)

- Still-missing base loaders (`extension`, `deliverable`, `document`, `budget_neutrality_workbook`) — `build_app` no-ops on missing files. (`amendment` is now BUILT, `585f9ee`, so it is no longer in this list.)
- Contacts (`mdcd_*_cntct`) deferred; renewals (deliberate no-op). `demonstration_role_assignment` / `system_role_assignment` are now BUILT (the W1 split feeds them).
- `40_indexes` — keep empty (Prisma owns target indexes); add only migration-private `mysql_raw`/`stg` build-acceleration indexes if a rehearsal shows a slow phase.
- CODE_REVIEW M1/M3/M4 — real, "before cutover day," not rehearsal blockers. (S3, the history tripwire, is moot: the history phase was removed in 0.7.0.) Note H1/H2 are the exception — see the Status section; they should land before the rehearsal is trusted.

## Self-review notes

- Spec coverage: every blocker from the scope (crosswalks W2–W4, the W1 role split, parity RED W5–W6, constraints W7, env W0, rehearsal W9, plus the target-side W8 sequences) maps to a task. W1/W2/W3 are now DONE; see the Status section.
- Type/name consistency: target seed `id` values used in Tasks 1–2 are copied verbatim from the pinned Prisma DDL seeds; `_run`/`pg_db`/`CHECK_DIR` reuse the existing `tests/sql/test_crosswalk_checks.py` fixtures.
- Risk ordering: Tasks 1–2 (lowest risk, pure code) shipped first; the remaining schedule drivers are the SME calls (W4) and the data-dependent parity fixes (W5–W6), plus W8 sequences and the two CODE_REVIEW High fixes.
