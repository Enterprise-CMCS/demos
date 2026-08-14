SHELL := /bin/sh

BUNDLE := bundle
ASCIIDOCTOR := $(BUNDLE) exec asciidoctor
REVEALJS := $(BUNDLE) exec asciidoctor-revealjs
PYTHON := uv run python

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

.PHONY: help all install html deck cli-ref watch clean

help:
	@echo "Targets:"
	@echo "  install   bundle install (asciidoctor + extensions)"
	@echo "  html      build README.html + every per-page HTML (multi-page docs set)"
	@echo "  deck      build the reveal.js deck(s)"
	@echo "  cli-ref   regenerate $(CLI_REF) from migrate --help"
	@echo "  watch     rebuild html on any *.adoc change (requires entr)"
	@echo "  all       cli-ref + html + deck"
	@echo "  clean     remove build/ and .asciidoctor/"

install:
	$(BUNDLE) install

cli-ref:
	cd .. && $(PYTHON) docs/tools/cli_to_adoc.py > docs/$(CLI_REF)

# Multi-page documentation set. Each .adoc renders to its own .html at
# the matching relative path under build/, so `xref:foo.adoc#bar[]`
# resolves naturally to `foo.html#bar`. README.html is the entry point.
html: cli-ref
	mkdir -p build/spec build/operator build/developer build/sme
	$(ASCIIDOCTOR) $(ASCII_OPTS) -D build           README.adoc
	$(ASCIIDOCTOR) $(ASCII_OPTS) -D build/spec      spec/canonical-spec.adoc
	$(ASCIIDOCTOR) $(ASCII_OPTS) -D build/operator  operator/*.adoc
	$(ASCIIDOCTOR) $(ASCII_OPTS) -D build/developer developer/*.adoc
	$(ASCIIDOCTOR) $(ASCII_OPTS) -D build/sme       sme/*.adoc

deck:
	mkdir -p build
	$(REVEALJS) \
	  -r asciidoctor-diagram \
	  -a revealjsdir=https://cdn.jsdelivr.net/npm/reveal.js@5 \
	  -a diagram-format=svg \
	  -a mermaid-format=svg \
	  -a diagram-svg-type=inline \
	  -a mermaid-config=$(abspath mermaid-config.json) \
	  -a mermaid-css=$(abspath mermaid.css) \
	  -D build \
	  decks/*.adoc

all: cli-ref html deck

watch:
	@command -v entr >/dev/null 2>&1 || { echo "entr not installed; brew install entr"; exit 1; }
	find . -name '*.adoc' | entr -c $(MAKE) html

clean:
	rm -rf build .asciidoctor
