# Timestamp timezone audit (date-only values)

Why migrated calendar dates rendered one day early for Eastern users, what
DEMOS's canonical convention actually is, and how the migration was corrected to
match it. Companion to `reports/narrative/milestone_date_mapping.md`.

## Symptom

A data engineer flagged that dates in the migrated database were at odds with
how the migration handled timestamps. Concretely: a legacy `effective_date` of
`2024-12-16` displayed as **2024-12-15** for an Eastern-time user of the DEMOS
app and its SQL reports.

## Root cause

The migration cast legacy MySQL `date` columns (calendar dates, no time-of-day)
straight to `timestamptz` with a bare `::timestamptz`. The DEMOS RDS session runs
in **UTC**, so `'2024-12-16'::timestamptz` becomes **`2024-12-16 00:00:00+00`**
(midnight UTC). Every consumer that renders a `timestamptz` back to a calendar
date does so in **America/New_York**:

- SQL reports / views render with `... AT TIME ZONE 'America/New_York'`.
- The DEMOS client renders with a browser-local / Eastern `TZDate`.

Midnight UTC is `2024-12-15 19:00` Eastern (EST), so the rendered calendar date
is the **previous day**. The migration wrote a correct instant for the wrong
convention.

## DEMOS's canonical convention (the target)

DEMOS does **not** store date-only values as midnight UTC. It anchors them to
**America/New_York**, and distinguishes start-of-day from end-of-day per
date type:

- `server/src/constants.ts` -> `DATE_TYPES_WITH_EXPECTED_TIMESTAMPS` maps every
  `date_type` to either **"Start of Day"** (midnight Eastern) or **"End of Day"**
  (`23:59:59.999` Eastern). Only two milestone types are End of Day:
  `Completeness Review Due Date` and `Federal Comment Period End Date`.
- The GraphQL write path (`parseSetApplicationDatesInput` / the deliverable and
  effective/expiration date parsers) constructs an Eastern `TZDate` at
  `00:00:00.000` or `23:59:59.999` before persisting - e.g. the server tests pin
  values like `new TZDate(2026, 9, 28, 23, 59, 59, 999, "America/New_York")`.
- The in-database triggers in `server/src/sql/functions.sql` compute "today"
  with `timezone('America/New_York', date_trunc('day', timezone('America/New_York', CURRENT_TIMESTAMP)))`
  - i.e. midnight **Eastern**, expressed as a UTC instant - confirming the
  convention holds at the DB layer, not just in the app.

So the correct stored instant for `2024-12-16` (Start of Day) is
`2024-12-16 05:00:00+00` in winter (EST, `-05:00`) or `2024-12-16 04:00:00+00`
in summer (EDT, `-04:00`); End of Day is `2024-12-17 04:59:59.999+00` (winter).

## The fix

Anchor every date-only value to Eastern at write time, reproducing DEMOS's
Start-of-Day / End-of-Day rule exactly, via two tested helpers in
`sql/00_init/03_helper_fns.sql`:

```sql
migration.eastern_day_start(p_date date) -> timezone('America/New_York', p_date::timestamp)
migration.eastern_day_end(p_date date)   -> timezone('America/New_York', p_date::timestamp
                                              + interval '1 day' - interval '1 millisecond')
```

Both are `STABLE STRICT` (NULL in -> NULL out). Applied across the date-only
columns:

| Loader | Column(s) | Anchor |
|---|---|---|
| `sql/10_stg/25_application_milestone.sql` | 17 milestone values | SOD, except `Completeness Review Due Date` + `Federal Comment Period End Date` = EOD |
| `sql/10_stg/22_demonstration_resolved.sql` | `effective_date`, `approval_date` / `expiration_date` | SOD / EOD |
| `sql/10_stg/24_pending_demonstration_resolved.sql` | `effective_date` / `expiration_date` | SOD / EOD |
| `sql/10_stg/28_deliverable_resolved.sql` | `due_date` (all COALESCE branches) | SOD |
| `sql/10_stg/30_amendment_resolved.sql` | `effective_date` | SOD |
| `sql/21_app_associative/10`,`11`,`12`,`13` | tag validity `from_dt` / `to_dt` | SOD / EOD |

True instants (`created_at` / `updated_at` / `status_updated_at`, sourced from
MySQL `timestamp`) are **left untouched** - they are real points in time, not
calendar dates.

**Render fix.** `sql/20_app/35_amendment.sql` and `sql/99_parity/52_amendment_load.sql`
synthesize an amendment name that embeds `to_char(effective_date, 'YYYY-MM-DD')`.
Because `effective_date` is now an Eastern-anchored `timestamptz`, that render is
wrapped with `AT TIME ZONE 'America/New_York'` so the printed date matches the
source calendar date regardless of session timezone.

**Cutover constant.** The Federal Comment past-window failsafe compares a
now-Eastern-anchored `date_value` against the go-live boundary, so the boundary
was re-anchored from `TIMESTAMPTZ '2026-08-20 00:00:00+00'` to
`TIMESTAMPTZ '2026-08-20 00:00:00-04:00'` (Eastern midnight, EDT) in
`sql/23_app_derived/50_application_phase.sql` and the parity guard
`sql/99_parity/56_application_milestone.sql`.

**Session timezone pin (defense-in-depth).** Independently of the anchoring, the
migration now pins its Postgres session to UTC so the run is deterministic on any
host: `migration/lib.py` `pg_dsn()` appends `options=-c timezone=UTC`, and the
pgloader scripts (`pgloader/schema.load`, `pgloader/delta.tmpl.load`) add
`timezone to 'UTC'`. This keeps the 16 audit `datetime` columns converting
deterministically and prevents a stray non-UTC session from re-introducing the
off-by-one on any residual bare cast.

## Verification

`tests/sql/test_eastern_date_helpers.py` pins the exact UTC instants across the
EST/EDT boundary, NULL handling, session-timezone independence, and idempotent
re-apply. Round-trip assertions in the loader tests prove
`to_char(date_value AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')` equals the
source calendar date for both a SOD and an EOD value; `tests/sql/test_session_timezone.py`
asserts the apply connection reports `TimeZone=UTC`.

## Handoff: the DuckDB exporter (out of scope here)

The audit also surfaced a divergence in the offline DuckDB exporter
(`pmda_exporter.py`): its `DATA_CONVERSIONS` render MySQL `datetime` as a **naive**
`timestamp` (no zone), whereas the real load path (pgloader `casts.load`) produces
`timestamptz`. This does **not** affect the migrated database - pgloader is the
load path and DEMOS remains the source of truth for the convention. It is left as
a **recommendation to the data-tools team**: align the exporter's `datetime`
handling with pgloader (emit `timestamptz`), or document the exporter as a
lossy/naive convenience snapshot that must not be treated as instant-accurate.
No migration loader depends on the exporter output.
