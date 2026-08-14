SHELL := /bin/sh

# Keep the project venv out of iCloud-synced paths (e.g. ~/Documents). When the
# venv lives under an iCloud folder, macOS evicts files to the cloud (`dataless`
# flag) and Python startup blocks while they re-download, which hangs every
# `uv run`. Override by exporting UV_PROJECT_ENVIRONMENT yourself (e.g. in CI).
export UV_PROJECT_ENVIRONMENT ?= $(HOME)/.venvs/demos-migration

# A stale `source .venv/bin/activate` leaves VIRTUAL_ENV pointing at the old
# in-project .venv, which makes uv print a "does not match the project
# environment" warning. Drop it from recipe shells so uv just uses
# UV_PROJECT_ENVIRONMENT cleanly.
unexport VIRTUAL_ENV

UV     := uv
RUN    := $(UV) run
MIGRATE := $(RUN) migrate
PRETTY := $(RUN) python scripts/mk_pretty.py
STEP   := $(PRETTY) run

.PHONY: help sync clean clean-state clean-all clean-reports status init ddl seeds crosswalks id_maps \
        load_full fk_candidates schema_snapshot reference_data load_fidelity crosswalk_audit verify_prod_schema \
        fetch_prisma fetch_prisma_schema preflight freeze delta build \
        constraints parity flip smoke decom rollback resume diagnose rebuild test lint typecheck \
        migrate-local migrate-local-verify \
        sql-fmt sql-fmt-check sql-lint sql-frontmatter sql-check \
        test-db-up test-db-down test-db-dsn compose-up compose-down integration-test \
        spin_up spin_down demonstration-flow-trace amendment-flow-trace

help:
	@$(PRETTY) help root

# uv reads pyproject.toml; --extra dev pulls in pytest/ruff/mypy.
sync:
	@$(STEP) sync "$(UV) sync --extra dev"

clean:
	@$(STEP) clean "rm -rf '$(UV_PROJECT_ENVIRONMENT)' .venv build dist *.egg-info; find . -type d -name __pycache__ -exec rm -rf {} +"

# Drop runtime gate state and pgloader logs, but keep parity reports
# (audit artifacts you may need post-incident).
clean-state:
	@$(STEP) clean-state "rm -f state/*.ok state/*.txt state/*.csv state/*.rendered.load; rm -f reports/runs/pgloader_*.log"

# Wipe everything including parity reports. Destructive; ask before running.
clean-all: clean clean-state
	@$(STEP) clean-all "rm -f reports/runs/parity_*.md"

# Drop regeneratable local report artifacts: the MySQL schema snapshot +
# reference-data dumps, per-row orphan CSVs, timestamped run logs, the Prisma
# fetch source dumps, the schema-drift report, and the gitignored run-markers
# under reports/generated/. Preserves committed inputs, crosswalks, narrative
# docs, and the curated reports/rehearsals/ archives (the .DS_Store sweep below
# explicitly prunes reports/rehearsals/ so it is never touched). Destructive;
# regenerate via the pipeline (schema-snapshot / reference-data / parity / fetch-prisma).
clean-reports:
	@$(STEP) clean-reports "rm -rf reports/schema_snapshot reports/reference_data; rm -f reports/orphans/*.csv; rm -f reports/runs/*.md reports/runs/*.log; rm -f reports/prisma_ddl_source.txt reports/prisma_schema_source.txt reports/schema_drift_report.md; rm -f reports/generated/scope_coverage.csv reports/generated/crosswalk_audit_manifest.json reports/generated/load_fidelity_manifest.json; find reports -name .DS_Store -not -path 'reports/rehearsals/*' -delete"

# --- build pipeline ---
# Ordered to match the runtime sequence (= `make rebuild` minus the cutover
# phases): init -> ddl -> load_full -> seeds -> crosswalks -> id_maps. The
# fetch_prisma*/verify_prod_schema/fk_candidates/load_fidelity/schema_snapshot/
# reference_data targets are auxiliary (off the rebuild path) and sit next to
# the step they feed.
init:          ; @$(STEP) init "$(MIGRATE) init"
fetch_prisma:  ; @$(STEP) fetch_prisma "$(MIGRATE) fetch-prisma $(ARGS)"
fetch_prisma_schema: ; @$(STEP) fetch_prisma_schema "$(MIGRATE) fetch-prisma-schema $(ARGS)"
verify_prod_schema: ; @$(STEP) verify_prod_schema "$(MIGRATE) verify-prod-schema $(ARGS)"
ddl:           ; @$(STEP) ddl "$(MIGRATE) ddl"
load_full:     ; @$(STEP) load_full "$(MIGRATE) load-full"
fk_candidates: ; @$(STEP) fk_candidates "$(MIGRATE) fk-candidates"
load_fidelity: ; @$(STEP) load_fidelity "$(MIGRATE) load-fidelity $(ARGS)"
crosswalk_audit: ; @$(STEP) crosswalk_audit "$(RUN) python scripts/crosswalk_audit.py $(ARGS)"
schema_snapshot: ; @$(STEP) schema_snapshot "$(MIGRATE) schema-snapshot"
reference_data: ; @$(STEP) reference_data "$(MIGRATE) reference-data"
seeds:         ; @$(STEP) seeds "$(MIGRATE) seeds"
crosswalks:    ; @$(STEP) crosswalks "$(MIGRATE) crosswalks"
id_maps:       ; @$(STEP) id_maps "$(MIGRATE) id-maps"

# --- cutover phases ---
preflight:   ; @$(STEP) preflight "$(MIGRATE) preflight"
freeze:      ; @$(STEP) freeze "$(MIGRATE) freeze"
delta:       ; @$(STEP) delta "$(MIGRATE) delta"
build:       ; @$(STEP) build "$(MIGRATE) build"
constraints: ; @$(STEP) constraints "$(MIGRATE) constraints"
parity:      ; @$(STEP) parity "$(MIGRATE) parity $(ARGS)"
flip:        ; @$(STEP) flip "$(MIGRATE) flip"
smoke:       ; @$(STEP) smoke "$(MIGRATE) smoke"
decom:       ; @$(STEP) decom "$(MIGRATE) decom"
rollback:    ; @$(STEP) rollback "$(MIGRATE) rollback"
resume:      ; @$(STEP) resume "$(MIGRATE) resume"
status:      ; @$(STEP) status "$(MIGRATE) status"
diagnose:    ; @$(STEP) diagnose "$(MIGRATE) diagnose"

rebuild: init ddl load_full seeds crosswalks id_maps build constraints parity
	@$(PRETTY) msg "Full rebuild complete."

# --- devcontainer load (ship transformed demos_app into ../demos) ---
# migrate-local builds the pipeline in a scratch demos_migration DB inside the
# DEMOS devcontainer's own Postgres (no separate spin_up container, built with
# SKIP_JSONSCHEMA) and ships ONLY the demos_app data into the devcontainer's
# demos DB. Pass extra flags via ARGS (e.g. ARGS="--no-build", or
# ARGS="--external-scratch" to build against a standalone scratch PG / PG_URL).
# migrate-local-verify runs just the pin-vs-local guard. See
# runbooks/demos-devcontainer-load.md.
migrate-local-verify: ; @$(STEP) migrate-local-verify "$(MIGRATE) verify-prisma-local"
migrate-local: ; @$(STEP) migrate-local "$(RUN) python scripts/migrate_local.py $(ARGS)"

# --- dev ---
test:      ; @$(STEP) test "$(RUN) pytest --cov=migration --cov-report=term-missing"
lint:      ; @$(STEP) lint "$(RUN) ruff check migration tests"
typecheck: ; @$(STEP) typecheck "$(RUN) ty check migration tests"

# --- SQL hygiene ---
# pg_format owns all SQL layout + case; sqlfluff is lint-only; every authored
# file carries a structured front-matter block. See
# docs/developer/reference-sql-conventions.adoc. pre-commit runs the same three
# checks on staged .sql (run `uv run pre-commit install` once).
sql-fmt:         ; @$(STEP) sql-fmt "$(RUN) python scripts/sql_fmt.py --write"
sql-fmt-check:   ; @$(STEP) sql-fmt-check "$(RUN) python scripts/sql_fmt.py --check"
sql-lint:        ; @$(STEP) sql-lint "$(RUN) sqlfluff lint sql scripts tests/sql/fixtures"
sql-frontmatter: ; @$(STEP) sql-frontmatter "$(RUN) python scripts/check_sql_frontmatter.py"
sql-check: sql-fmt-check sql-lint sql-frontmatter
	@$(PRETTY) msg "SQL hygiene checks passed."

# Regenerate the live demonstration migration-flow trace partial + manifest
# (committed; the live SQL harness checks for drift) by replaying the real
# pipeline against a curated mysql_raw fixture on a throwaway Postgres. Resolves
# PG_TEST_DSN like the SQL harness (export it, or have a harness reachable).
demonstration-flow-trace:
	@$(STEP) demonstration-flow-trace "$(RUN) python docs/tools/table_flow_trace.py --table demonstration"

# Regenerate the live amendment migration-flow run trace + manifest the same way
# (curated mysql_raw fixture replayed on a throwaway Postgres). The amendment
# loader needs loaded parent demonstrations, so the fixture seeds those too.
amendment-flow-trace:
	@$(STEP) amendment-flow-trace "$(RUN) python docs/tools/table_flow_trace.py --table amendment"

# Throwaway pg_jsonschema Postgres for the deeper-layer SQL harness
# (tests/sql/test_app_layers_idempotency.py). The vanilla SQL harnesses skip
# without PG_TEST_DSN; this one additionally needs pg_jsonschema, which the
# supabase/postgres image bundles. `make test-db-up` starts the container;
# build PG_TEST_DSN from the PG_TEST_* vars below into a gitignored .env file
# (e.g. .env.test), source it, then run `make test`. `make test-db-down`
# removes the container.
PG_TEST_IMAGE := supabase/postgres:15.8.1.060
PG_TEST_USER  := supabase_admin
PG_TEST_PASS  := postgres
PG_TEST_PORT  := 55432
PG_TEST_DB    := harness
test-db-up:
	@$(STEP) test-db-up "docker run -d --name demos-test-pg -e POSTGRES_PASSWORD=*************** -e POSTGRES_DB=$(PG_TEST_DB) -p $(PG_TEST_PORT):5432 $(PG_TEST_IMAGE) >/dev/null"
	@$(PRETTY) msg "demos-test-pg up on localhost:$(PG_TEST_PORT) (db $(PG_TEST_DB), user $(PG_TEST_USER)). Build PG_TEST_DSN from the PG_TEST_* Makefile vars into a gitignored .env file, source it, then run make test."
test-db-down:
	@$(STEP) test-db-down "docker rm -f demos-test-pg >/dev/null"

# Resolve a working PG_TEST_DSN by reusing an already-running Postgres
# (demos-test-pg, else demos-dev-pg) on a throwaway `harness` db before spinning
# up a new container. Prints ONLY the DSN (no PRETTY wrapper) so it can be
# captured: PG_TEST_DSN="$$(make -s test-db-dsn)" uv run pytest tests/sql/ -v
test-db-dsn:
	@sh scripts/ensure_test_db.sh

# Local dev target Postgres for `make init` / `make rebuild`. Reuses the
# supabase/postgres pin (bundles pg_jsonschema). `spin_up` reads PG_DB /
# PG_USER / PG_PASSWORD / PG_PORT from .env, starts the container, and
# bootstraps -- as the built-in superuser -- a least-privilege owner role
# (LOGIN CREATEDB CREATEROLE, not superuser), its database, and the required
# extensions, so the pipeline (connecting via PG_URL as PG_USER) runs
# end-to-end. Distinct from test-db-up (SQL harness, 55432) and compose-up
# (integration tier).
PG_DEV_CONTAINER := demos-dev-pg
PG_DEV_IMAGE     := $(PG_TEST_IMAGE)
spin_up:
	@$(STEP) spin_up "PG_DEV_CONTAINER=$(PG_DEV_CONTAINER) PG_DEV_IMAGE=$(PG_DEV_IMAGE) sh scripts/spin_up.sh"
spin_down:
	@$(STEP) spin_down "docker rm -f $(PG_DEV_CONTAINER) >/dev/null 2>&1 || true"
	@$(PRETTY) msg "removed $(PG_DEV_CONTAINER) (if it existed)."

# Integration tier: MySQL source + target PG + reference PG for the
# `integration`-marked live tests (load-fidelity dual-attach, prod-schema
# guard). See docker-compose.test.yml for the DSNs to export.
COMPOSE := docker compose -f docker-compose.test.yml
compose-up:
	@$(STEP) compose-up "$(COMPOSE) up -d --wait"
	@$(PRETTY) msg "Integration engines up. Export PG_TEST_DSN / REFERENCE_PG_URL / MYSQL_URL (see docker-compose.test.yml), then: uv run pytest -m integration"
compose-down:
	@$(STEP) compose-down "$(COMPOSE) down -v"
integration-test:
	@$(STEP) integration-test "$(RUN) pytest -m integration"
