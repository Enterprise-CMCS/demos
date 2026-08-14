SHELL := /bin/sh

# Keep the project venv out of iCloud-synced paths; see the root Makefile for
# why. Override by exporting UV_PROJECT_ENVIRONMENT yourself (e.g. in CI).
export UV_PROJECT_ENVIRONMENT ?= $(HOME)/.venvs/demos-migration

# Drop a stale VIRTUAL_ENV (e.g. from `source .venv/bin/activate`) from recipe
# shells so uv doesn't warn about it not matching UV_PROJECT_ENVIRONMENT.
unexport VIRTUAL_ENV

BUNDLE := bundle
# Use mise to activate the Ruby version from mise.toml so gem commands
# (asciidoctor, kramdoc) run under the correct Ruby (3.3, not the system
# 4.0 that drops the bundled `logger` gem). Fall back to plain bundle
# when mise is not installed (e.g. CI).
ifneq ($(shell command -v mise 2>/dev/null),)
BUNDLE := mise exec -- bundle
endif
ASCIIDOCTOR := $(BUNDLE) exec asciidoctor
REVEALJS := $(BUNDLE) exec asciidoctor-revealjs
PYTHON := uv run python
# Same mise guard as BUNDLE: activate Ruby/gem bins locally, fall back
# to plain uv run python in CI (where ruby/setup-ruby handles PATH).
ifneq ($(shell command -v mise 2>/dev/null),)
PYTHON := mise exec -- uv run python
endif
PRETTY := uv run python ../scripts/mk_pretty.py
STEP   := $(PRETTY) run

# asciidoctor-diagram needs mmdc (mermaid CLI) on PATH for mermaid block
# rendering during `make html` / `make deck`. When node is managed by nvm,
# the bin directory is not on the shell PATH by default. Detect it from
# common nvm layouts and prepend so mmdc is discoverable. Override by
# exporting NVM_BIN (or putting mmdc on PATH yourself).
NVM_BIN ?= $(firstword $(wildcard $(HOME)/.local/share/nvm/*/bin) $(wildcard $(HOME)/.nvm/versions/node/*/bin))
export PATH := $(NVM_BIN):$(PATH)

DECK_OUT := build/cutover-day.html
CLI_REF  := operator/reference-cli.adoc

# Default attributes that mirror docs/attributes.adoc so every page
# gets the same toc / icons / highlighter / section style without
# each file having to `include::` the attributes block itself.
ASCII_ATTRS := \
  -a doctype=book \
  -a icons=font \
  -a source-highlighter=rouge \
  -a toc=left \
  -a toclevels=3 \
  -a sectnums \
  -a sectanchors \
  -a sectlinks \
  -a experimental \
  -a docinfo=shared \
  -a docinfodir=$(abspath .) \
  -a diagram-format=svg \
  -a mermaid-format=svg \
  -a plantuml-format=svg \
  -a graphviz-format=svg \
  -a ditaa-format=svg \
  -a diagram-svg-type=inline \
  -a mermaid-config=$(abspath mermaid-config.json) \
  -a mermaid-css=$(abspath mermaid.css)

ASCII_OPTS := \
  -r asciidoctor-diagram \
  -a allow-uri-read \
  -a failure-level=WARN \
  $(ASCII_ATTRS)

.PHONY: help all install html deck cli-ref column-map schema-diagrams schema-drift live-partials \
        flow-pages derivability data-dictionary prisma-analysis verify verify-schema-refs verify-crosswalks \
        verify-counts verify-doc-facts verify-prisma-analysis watch clean

help:
	@$(PRETTY) help docs

install:
	@$(STEP) install "$(BUNDLE) install"

cli-ref:
	@$(STEP) cli-ref "cd .. && $(PYTHON) docs/tools/cli_to_adoc.py > docs/$(CLI_REF)"

# The seed mapping CSV only covers a handful of MySQL tables today;
# --allow-uncovered-tables demotes the per-table coverage requirement
# from a hard build error into a count + collapsible list inside the
# generated coverage adoc fragment, so the SME can see remaining work
# while `make html` keeps building. Drop the flag once every MySQL
# PMDA table either has a row in reports/source_target_columns.csv
# or an entry in reports/narrative/drop_list.md.
column-map:
	@$(STEP) column-map "cd .. && $(PYTHON) docs/tools/source_target_columns_to_adoc.py --allow-uncovered-tables"

# Regenerate the mermaid schema diagrams (committed; CI checks for drift via
# git diff --exit-code) from the Prisma DDL + captured FKs + schema snapshot.
schema-diagrams:
	@$(STEP) schema-diagrams "cd .. && $(PYTHON) docs/tools/schema_diagrams_to_adoc.py"

# Warn-only cross-check of the generated target model against the legacy
# hand-authored DEMOS_Data_Model.mmd. Never fails the build.
schema-drift:
	@$(STEP) schema-drift "cd .. && $(PYTHON) docs/tools/schema_diagrams_to_adoc.py --check-drift"

# Regenerate the static per-table migration-flow partials (committed; CI checks
# for drift via git diff --exit-code) from reports/source_target_columns.csv,
# reports/crosswalks/*.csv, and the sql/ stage tree. Fails closed on a missing
# crosswalk CSV or renamed stage file. The live run trace under
# shared/generated/live/ is regenerated separately by the DB-gated root
# `make demonstration-flow-trace` target.
flow-pages:
	@$(STEP) flow-pages "cd .. && $(PYTHON) docs/tools/table_flow_to_adoc.py --table demonstration && $(PYTHON) docs/tools/table_flow_to_adoc.py --table amendment"

# Render the live Markdown working files (reports/*.md, runbooks/*.md) into
# committed AsciiDoc partials under shared/generated/live/ so the pages that
# include them render tables/headings instead of raw Markdown. Needs kramdoc.
live-partials:
	@$(STEP) live-partials "cd .. && $(PYTHON) docs/tools/md_to_adoc.py"

# Regenerate the derivability-audit fragments (committed; CI checks for drift
# via git diff --exit-code) from the pinned Prisma DDL + schema snapshot +
# reports/inputs/derivability_verdicts.yaml. Fails closed if a verdict and the live
# in-scope gap set disagree.
derivability:
	@$(STEP) derivability "cd .. && $(PYTHON) scripts/derivability_audit.py"

# Regenerate the data-dictionary partial (committed; CI checks for drift via
# git diff --exit-code) from the pinned Prisma DDL + sql/01_ddl_supplements,
# replaying the concatenated migration history so ADD COLUMN / ALTER COLUMN /
# ADD/DROP CONSTRAINT / CREATE UNIQUE INDEX fold onto the CREATE TABLE blocks.
data-dictionary:
	@$(STEP) data-dictionary "cd .. && $(PYTHON) docs/tools/data_dictionary_to_adoc.py"

# Regenerate the Prisma migration analysis partial (committed; CI checks for
# drift via git diff --exit-code) from the pinned Prisma DDL. Classifies every
# migration-relevant statement (CREATE TABLE/SEQUENCE, INSERT, ADD COLUMN,
# SET/DROP DEFAULT, SET NOT NULL, ADD CONSTRAINT CHECK, UPDATE backfills,
# DELETE, trigger toggles) so a new upstream migration cannot land silently.
prisma-analysis:
	@$(STEP) prisma-analysis "cd .. && $(PYTHON) docs/tools/prisma_migration_analysis.py"

# Documentation <-> code consistency checks. Each script reads the same
# authoritative model as the generators and exits non-zero on drift, so a
# stale reference, crosswalk, or count fails `make all`. The generated
# partials must be fresh first (hence the schema-diagrams prerequisite).
verify-schema-refs:
	@$(STEP) verify-schema-refs "cd .. && $(PYTHON) docs/tools/verify_schema_refs.py"

verify-crosswalks:
	@$(STEP) verify-crosswalks "cd .. && $(PYTHON) docs/tools/verify_crosswalks.py"

verify-counts: schema-diagrams
	@$(STEP) verify-counts "cd .. && $(PYTHON) docs/tools/verify_counts.py"

# Assert the hand-authored reference tables/lists (gate graph, env vars,
# pgloader template markers, package surface, Makefile targets, pipeline
# stage dirs, JSONB registry, PMDA regex) still match the code they describe.
verify-doc-facts:
	@$(STEP) verify-doc-facts "cd .. && $(PYTHON) docs/tools/verify_doc_facts.py"

# Fail closed if the committed Prisma migration analysis partial is stale
# relative to the pinned DDL (same git-diff contract as the other generators).
verify-prisma-analysis:
	@$(STEP) verify-prisma-analysis "cd .. && $(PYTHON) docs/tools/prisma_migration_analysis.py --check"

verify: schema-diagrams derivability verify-schema-refs verify-crosswalks verify-counts verify-doc-facts verify-prisma-analysis

# Multi-page documentation set. Each .adoc renders to its own .html at
# the matching relative path under build/, so `xref:foo.adoc#bar[]`
# resolves naturally to `foo.html#bar`. README.html is the entry point.
html: cli-ref column-map schema-diagrams live-partials flow-pages derivability data-dictionary prisma-analysis
	@command -v mmdc >/dev/null 2>&1 || { echo "mmdc (mermaid CLI) not found on PATH -- mermaid diagrams will not render. Install it or set NVM_BIN / PATH so mmdc is discoverable."; exit 1; }
	@$(STEP) html "mkdir -p build/spec build/operator build/developer build/sme && $(ASCIIDOCTOR) $(ASCII_OPTS) -D build README.adoc toc.adoc && $(ASCIIDOCTOR) $(ASCII_OPTS) -D build/spec spec/*.adoc && $(ASCIIDOCTOR) $(ASCII_OPTS) -D build/operator operator/*.adoc && $(ASCIIDOCTOR) $(ASCII_OPTS) -D build/developer developer/*.adoc && $(ASCIIDOCTOR) $(ASCII_OPTS) -D build/sme sme/*.adoc"

deck:
	@$(STEP) deck "mkdir -p build && $(REVEALJS) -r asciidoctor-diagram -a revealjsdir=https://cdn.jsdelivr.net/npm/reveal.js@5 -a diagram-format=svg -a mermaid-format=svg -a diagram-svg-type=inline -a mermaid-config=$(abspath mermaid-config.json) -a mermaid-css=$(abspath mermaid.css) -D build decks/cutover-day.adoc"

all: cli-ref column-map schema-diagrams live-partials flow-pages data-dictionary prisma-analysis verify html deck

watch:
	@command -v entr >/dev/null 2>&1 || { echo "entr not installed; brew install entr"; exit 1; }
	@$(STEP) watch "find . -name '*.adoc' | entr -c $(MAKE) html"

clean:
	@$(STEP) clean "rm -rf build .asciidoctor"
