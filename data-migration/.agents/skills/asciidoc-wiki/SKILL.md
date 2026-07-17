---
name: asciidoc-wiki
version: 1.1.0
description: |
  Author and build multi-page Asciidoctor documentation sets in the
  house style.

  Use this skill when the user wants to:
  - Bootstrap a new docs/ directory (Asciidoctor + asciidoctor-diagram +
    asciidoctor-revealjs, multi-page HTML output).
  - Add a new page to an existing wiki and have it follow the
    conventions (Diátaxis filename prefix, H1 per file, xref pattern,
    shared includes, docnav footer).
  - Add or restyle a mermaid / plantuml / state / Gantt diagram so it
    matches the project's mermaid.css palette.
  - Wire up between-page navigation (the `// docnav-start` /
    `// docnav-end` footer block) so xrefs feel like a book.
  - Build the wiki locally (mise + bundler + Make).

  Do NOT use this skill for general prose editing, README rewrites that
  do not touch the build/conventions, or non-Asciidoctor doc systems
  (Sphinx, MkDocs, Docusaurus, etc.).
---

You are an expert technical writer + build engineer for Asciidoctor
documentation sets. Your job is to (a) keep the house style consistent
across every page and (b) make the build, navigation, and diagram
styling boringly predictable.

The reference implementation lives in `assets/` alongside this file:

- `assets/attributes.adoc` — shared `:attribute:` block, always
  included at the top of every entry-point doc.
- `assets/Gemfile` — pinned Asciidoctor toolchain.
- `assets/Makefile` — multi-page HTML + Reveal.js + watch + clean.
- `assets/mise.toml` — Ruby version pin (`ruby = "3.3"`) and
  `BUNDLE_PATH = ".bundle"` so installs stay inside the repo.
- `assets/mermaid-config.json` — mermaid runtime defaults
  (`useMaxWidth`, Gantt sizing, flowchart spacing).
- `assets/mermaid.css` — overrides for the Gantt palette and the
  `foreignObject` clipping fix.

When bootstrapping, copy those files verbatim into the new `docs/`
directory before authoring any pages.

## 1. Stylistic conventions

These rules apply to *every* `.adoc` file you create or edit.

### File names

- Lowercase **kebab-case** only.
- Files that sit inside an audience book (operator / developer / sme /
  ops / ...) are **Diátaxis-prefixed**:
  - `tutorial-<slug>.adoc` — guided, learning-oriented walkthrough.
  - `howto-<slug>.adoc` — task-oriented, "do this to achieve X."
  - `reference-<slug>.adoc` — lookup material (CLI, config, gates).
  - `explanation-<slug>.adoc` — discussion / theory / "why."
- Each audience book has an `index.adoc` that lists its pages grouped
  by Diátaxis category.
- The single canonical specification (if the project has one) lives at
  `spec/canonical-spec.adoc` and is allowed to be long.

### Page skeleton

Every page starts like this:

```asciidoc
= Page title
:toc: left

Optional 1–3 sentence orientation paragraph. State who the audience is
and what they will know by the end.

== Section one
...

// docnav-start
ifndef::nested[]
'''

[.docnav,cols="1,1",frame=none,grid=none,stripes=none]
|===
|xref:previous-page.adoc[< previous]
>|xref:next-page.adoc[next >]
|===
endif::[]
// docnav-end
```

- **Exactly one** `H1` (`= Title`) per file, and it must be the first
  non-comment line.
- Section levels descend `== `, `=== `, `==== `. Never skip a level.
- Use sentence case for headings ("How to read", not "How To Read").
- Leave a blank line above and below every section heading, list, and
  block.

### Cross-references

- Page-to-page links **must** use `xref:other-file.adoc#anchor[Label]`
  (Asciidoctor resolves `.adoc` -> `.html` in multi-page builds).
- Same-page links use `<<anchor-id,Label>>`.
- Never use `link:` for internal docs; reserve `link:` for external
  URLs.
- Always supply explicit anchor IDs on sections you expect to be
  linked: `[[anchor-id]]` above the heading, or `[#anchor-id]` on it.

### Code samples

- Always specify a language: `[source,bash]`, `[source,sql]`,
  `[source,python]`, `[source,yaml]`, `[source,asciidoc]`.
- Use `----` delimiters, never indented blocks.
- Show *runnable* commands — no `$ ` prompts, no shell-prompt
  decorations. Keep paste-ability sacred.
- For multi-line commands, prefer `\` continuation over `&&` chains
  unless ordering matters.

Example:

```asciidoc
[source,bash]
----
make install
mise install
make html
----
```

### Shared prose and the source-of-truth rule

- Anything that appears in more than one page lives under `shared/`
  and is `include::`d. Never duplicate.
- When a page is the rendered view of a curated artifact (reports,
  CSVs, generated CLI references), `include::` the file directly so
  the docs track the source of truth. Example:

```asciidoc
include::{reports-dir}/pending_approved_decisions.md[]
```

- Auto-generated reference pages (e.g. CLI help) get committed but the
  CI must verify they have not drifted (`make cli-ref` + `git diff
  --exit-code`).

### Admonitions

Use sparingly. The five built-ins map roughly as:

- `NOTE` — incidental clarification.
- `TIP` — non-obvious shortcut that saves time.
- `IMPORTANT` — easy to miss, will bite you if you do.
- `WARNING` — data loss / production impact risk.
- `CAUTION` — destructive irreversible action.

### Tables

- Use `[cols="..."]` to set widths; never let Asciidoctor guess on a
  table wider than three columns.
- Header row uses `|===` ... `| Col | Col |===` pattern with a blank
  line after the header.
- For aligned columns: `[cols="1,3"]` (1:3 ratio), `[cols="1a,3"]`
  (first column is AsciiDoc-formatted).

## 2. Asciidoctor-diagram conventions

All diagram blocks are rendered server-side via `asciidoctor-diagram`
to **inline SVG**, so they style with CSS and scale cleanly. The Gemfile
and Makefile already wire this up; in pages, just write the block.

### Mermaid

Default form — let the CSS do the styling:

```asciidoc
[mermaid]
....
flowchart LR
  A[Source] --> B[Transform] --> C[(Target)]
....
```

For wide diagrams (Gantt, big state machines), set an explicit width
so the SVG keeps its size in the multi-page layout:

```asciidoc
[mermaid, width=1600]
....
gantt
  title Migration -- cutover Wed 2026-07-01
  dateFormat  YYYY-MM-DD
  axisFormat  %b %d
  excludes    weekends
  todayMarker stroke-width:3px,stroke:#d33,opacity:0.7

  section Build
  Foundation                  :done, p1, 2026-05-04, 5d
  Data transformation         :crit, p2, after p1, 25d

  section Validate
  Integration & UAT           :p3, after p2, 5d
  Rehearsals                  :p4, after p3, 5d

  section Go-live
  Cutover                     :crit, milestone, cut, 2026-07-01, 0d
  Hypercare                   :hc, after cut, 4d
....
```

### Gantt colour palette (defined in mermaid.css)

The CSS overrides Mermaid's defaults so the legend is stable across
all diagrams:

| Source tag       | Rendered as                    | Meaning                                |
|------------------|--------------------------------|----------------------------------------|
| (untagged)       | light gray (`#d6d6d6`)         | not started                            |
| `:done`          | green (`#5cb85c`)              | completed                              |
| `:active`        | blue (`#4a90e2`)               | reserved for future "actively in flight" |
| `:crit`          | amber (`#f0ad4e`)              | partial / in progress                  |
| `:crit, milestone` | red diamond (`#d9534f`)      | critical milestone (e.g. cutover)      |

When introducing a new state, add the rule to `mermaid.css` rather
than inlining styles in the diagram. Document the new tag in the page
that uses it with a `.Legend` `[NOTE]` block immediately below the
diagram.

### Gantt label readability

`mermaid.css` already forces *untagged* (gray) Gantt task labels to
black via a chain of `:not([class*=...])` selectors. If you add a new
state colour, audit that label contrast manually and extend the
selector list if needed — Mermaid uses `fill:` on `<text>`, not
`color:`, so CSS `color` declarations are no-ops.

### foreignObject fix

Every diagram inherits this rule from `mermaid.css`:

```css
foreignObject { overflow: visible !important; }
```

It removes the clip that otherwise truncates node labels by 1–2 px
when the rendering browser's font metrics differ from `mmdc`'s
headless-Chrome measurement. Do not remove it.

### Other engines

- `[plantuml]` blocks: same fenced form, same SVG output. Prefer
  `skinparam style strictuml` for component diagrams.
- `[graphviz]` blocks: use `digraph` with `rankdir=LR` for pipelines.
- `[ditaa]` blocks: only for ASCII-art that needs to remain ASCII-art.
- `[mermaid]` is the default — pick it unless you have a reason.

### Configuration

`mermaid-config.json` is the single source of truth for mermaid
runtime settings (Gantt sizing, flowchart wrapping, useMaxWidth).
Adjust there, not in individual blocks. The Makefile passes it via
`-a mermaid-config=...`.

## 3. Navigation: the docnav footer

Every page ends with a uniform "previous / next" navigation block.
The pattern:

```asciidoc
// docnav-start
ifndef::nested[]
'''

[.docnav,cols="1,1",frame=none,grid=none,stripes=none]
|===
|xref:previous-page.adoc[< previous]
>|xref:next-page.adoc[next >]
|===
endif::[]
// docnav-end
```

Rules:

1. **Always wrap in `ifndef::nested[]` / `endif::[]`.** This suppresses
   the footer when the page is `include::`d into another document
   (e.g. the canonical spec or a deck). The `nested` attribute should
   be set on the parent via `:nested:` so child includes see it.
2. **Always use the `// docnav-start` and `// docnav-end` sentinel
   comments.** Tooling (and humans) rely on them to locate the block
   for bulk updates.
3. **First column = previous, second column = next.** Omit the cell
   contents (leave the `|` empty) on the first/last page of a flow
   rather than removing the column — the two-column grid keeps the
   visual rhythm.
4. **Use `>|` to right-align the "next" cell.** Asciidoctor table
   cell-spec.
5. Use `< previous` / `next >` exactly (ASCII angle brackets, single
   space, no chevrons in Unicode).
6. The horizontal rule (`'''`) above the table is part of the pattern
   — it visually separates body from nav.

For audience-book index pages, add a top-of-page navigation cell as
well that points back to the wiki entry (`README.adoc`).

## 4. Project layout

The canonical shape of a wiki:

```
docs/
  README.adoc                # entry point; multi-page builds open here
  attributes.adoc            # shared :attribute: definitions
  Gemfile / Gemfile.lock     # toolchain
  Makefile                   # build targets
  mise.toml                  # ruby pin
  mermaid-config.json        # diagram engine config
  mermaid.css                # diagram CSS overrides
  spec/
    canonical-spec.adoc      # single long-form spec (optional)
  shared/                    # include::-only snippets, no H1, no toc
    architecture-overview.adoc
    glossary.adoc
    ...
  <audience>/                # one folder per audience book
    index.adoc
    tutorial-*.adoc
    howto-*.adoc
    reference-*.adoc
    explanation-*.adoc
  decks/                     # reveal.js slide decks
    <event>.adoc
  tools/                     # generators (e.g. cli_to_adoc.py)
  build/                     # generated HTML; .gitignored
```

Audience books are typically:

- `operator/` — solo operator running the production thing.
- `developer/` — engineer extending the codebase.
- `sme/` — subject-matter expert reviewing decisions.

Add or rename to fit the project, but keep each book scoped to a
single audience + use case.

### shared/ files

- No `H1`. Start directly at `==` so the `include::` lifts the content
  cleanly into the surrounding heading hierarchy.
- No `:toc:` attribute.
- No docnav footer.
- Keep them short and focused (one concept per file).

## 5. attributes.adoc

Every entry-point page (`README.adoc`, each `<audience>/index.adoc`,
`spec/canonical-spec.adoc`) starts with `include::attributes.adoc[]`
or accepts the same attributes from the Makefile. The canonical block:

```asciidoc
:doctype: book
:icons: font
:source-highlighter: rouge
:toc: left
:toclevels: 3
:sectnums:
:sectanchors:
:sectlinks:
:experimental:
:imagesdir: build
:docinfo: shared
:diagram-format: svg
:mermaid-format: svg
:plantuml-format: svg
:graphviz-format: svg
:ditaa-format: svg
:diagram-svg-type: inline
:mermaid-config: {repo-root}/docs/mermaid-config.json
:mermaid-css: {repo-root}/docs/mermaid.css
:repo-root: ..
:reports-dir: ../reports
:runbooks-dir: ../runbooks
:sql-dir: ../sql
```

The path attributes at the bottom (`reports-dir`, `runbooks-dir`,
`sql-dir`, ...) are project-specific. Add or remove them to match the
repo's top-level directories.

## 6. Building

Toolchain pinning is non-negotiable; Asciidoctor extensions are
sensitive to Ruby and bundler versions.

```bash
mise install                # ruby 3.3 (from mise.toml)
make install                # bundle install (asciidoctor + extensions)
make html                   # build/README.html + per-page HTML
make deck                   # build/<deck>.html (reveal.js)
make cli-ref                # regenerate reference-cli.adoc from --help
make all                    # cli-ref + html + deck
make watch                  # rebuild on save (requires `entr`)
make clean                  # remove build/ and .asciidoctor/
```

The Makefile builds **one HTML file per `.adoc`** under each audience
directory. That keeps the left-hand TOC scoped to a single page while
xref body links navigate between pages. The default entry point is
always `build/README.html`.

When CI fails the build with `failure-level=WARN`, the most common
causes are:

- Broken `xref:` target (file moved or renamed).
- Missing anchor on a `<<anchor>>` reference.
- `include::` path that doesn't resolve (check `:repo-root:` and the
  `*-dir` attributes).
- Mermaid syntax error (look for the diagram block above the warning).

## 7. Reveal.js decks

Slide decks live under `decks/`. They are *not* built by `make html`;
they have their own `make deck` target via `asciidoctor-revealjs`.

Skeleton:

```asciidoc
= Briefing title
:revealjs_theme: black
:revealjs_hash: true
:revealjs_slideNumber: c/t
:revealjs_history: true
:revealjs_transition: slide
:source-highlighter: highlight.js
:icons: font

== Agenda

[%step]
* Bullet one
* Bullet two
```

- `[%step]` reveals list items one at a time.
- Use `[mermaid]` blocks the same way — the deck Make target passes the
  same `mermaid-config.json` and `mermaid.css`.
- Use `:nested:` on the deck preamble *if* you include shared content
  that ships its own docnav footer.

## 8. Bootstrapping a new wiki

When the user asks to bootstrap a new docs/ tree:

1. Create `docs/` and copy in `attributes.adoc`, `Gemfile`, `Makefile`,
   `mise.toml`, `mermaid-config.json`, `mermaid.css` from this skill's
   `assets/` directory.
2. Add `docs/.gitignore` containing `build/` and `.bundle/`.
3. Create `docs/README.adoc` with at minimum: an intro paragraph, a
   "How to read" section listing the audience books, and a docnav
   footer linking forward to the first audience index.
4. Create one audience directory (start with `developer/` if unsure)
   with an `index.adoc` and one `tutorial-getting-started.adoc`.
5. Run `mise install && make install && make html` to verify the build
   before adding more content.

## 9. Adding a new page to an existing wiki

1. Pick the audience book and Diátaxis category.
2. Create `<audience>/<category>-<slug>.adoc` with the page skeleton
   from §1.
3. Add the page to `<audience>/index.adoc` under the matching category
   heading.
4. Update the docnav footer of the previous page (if any) to point to
   the new page, and set the new page's "next" to whatever was
   previously linked.
5. Run `make html` and open `build/README.html` to verify both the new
   page and the surrounding navigation.

## 10. Anti-patterns

- ❌ Multiple `H1`s in one file (Asciidoctor will warn; `make` will
  fail at `failure-level=WARN`).
- ❌ `link:` for internal page references — breaks multi-page rewrites.
- ❌ Duplicating content across pages instead of `include::`-ing from
  `shared/`.
- ❌ Hard-coded paths like `../../reports/foo.md` — use a `:reports-dir:`
  attribute so paths can be retargeted.
- ❌ Inline styles on diagrams (`style A fill:#...`). Update
  `mermaid.css` instead so the palette stays consistent.
- ❌ Manual table of contents. The `:toc: left` attribute handles it.
- ❌ Skipping the `ifndef::nested[]` guard around docnav — the footer
  shows up twice when the page is `include::`d.
- ❌ Committing `build/` — it's regenerated; `.gitignore` it.

## 11. Drift detection and doc-facts verification

Docs that reference live system state (CLI flags, env vars, SQL
columns, Makefile targets) go stale silently. The demos-data-migration
project pioneered two patterns to catch this in CI:

### Data-dictionary drift

Generate reference docs from the source of truth (e.g. Prisma DDL,
schema snapshot) and fail CI when the generated output diverges from
what is committed. The pattern:

1. A generator script (`scripts/mk_pretty.py`, `docs/tools/`) reads the
   live schema and emits an `.adoc` file.
2. The generated file is committed to the repo.
3. A CI step regenerates the file and `git diff --exit-code` fails if
   the committed version differs.

This catches added/removed columns, changed types, and new tables that
the docs have not been updated to reflect.

### Doc-facts verifier

A script (`docs/tools/docnav.py` and friends) that parses each `.adoc`
page and checks that every CLI flag, env var, Makefile target, and SQL
file path it mentions actually exists in the codebase. Run it in CI
alongside the build:

```sh
make verify-doc-facts   # or whatever the project calls it
```

When adding a new doc-facts check:
- Parse the `.adoc` for references (code spans, `link:`, `xref:`).
- Resolve each against the real source tree.
- Report unmatched references with file + line.
- Fail CI on any mismatch.

### Sortable tables

For reference tables that operators scan (column maps, gate
dependencies), add client-side sorting via `docinfo.html`:

```html
<!-- in docinfo.html -->
<script src="https://cdn.jsdelivr.net/npm/sorttable@1.0.2/sorttable.min.js"></script>
```

Then use `[<caption>]` with a normal table block. The
`:docinfo: shared` attribute in `attributes.adoc` ensures every page
picks up the script.
